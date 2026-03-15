const User = require('../models/User');
const Project = require('../models/Project');
const ChangeRequest = require('../models/ChangeRequest');

// Configurable points (can move to env later)
const TRUST = {
    BONUS_BEFORE_DEADLINE: 5,
    BONUS_ON_DEADLINE_DAY: 3, // submitted on the day of deadline
    PENALTY_AFTER_DEADLINE: 5,
    PENALTY_PER_DAY_LATE: 2,
    BONUS_REVISIONS_LEFT: 2,
    TRUST_MIN: 0,
    TRUST_MAX: 100,
    /** Client penalty per out-of-scope change request they posted (scope creep). */
    CLIENT_PENALTY_PER_OUT_OF_SCOPE: 3,
};

/**
 * Compute trust impact for a single project based on:
 * - Deadline: bonus if completed before, penalty if after (scaled by days late)
 * - Revisions: small bonus if finished with revisions to spare
 * @param {Object} project - Project doc with deadline, completedAt, revisionLimit, revisionsUsed
 * @returns {number} trustImpact (positive or negative)
 */
function computeTrustImpact(project) {
    let impact = 0;
    const completedAt = project.completedAt ? new Date(project.completedAt) : null;
    const deadline = project.deadline ? new Date(project.deadline) : null;

    if (deadline && completedAt) {
        const deadlineEnd = new Date(deadline);
        deadlineEnd.setHours(23, 59, 59, 999);
        if (completedAt < deadline) {
            impact += TRUST.BONUS_BEFORE_DEADLINE;
        } else if (completedAt <= deadlineEnd) {
            impact += TRUST.BONUS_ON_DEADLINE_DAY; // on the day of deadline: 2–3 pts
        } else {
            const daysLate = Math.ceil((completedAt - deadlineEnd) / (24 * 60 * 60 * 1000));
            impact -= TRUST.PENALTY_AFTER_DEADLINE + (daysLate - 1) * TRUST.PENALTY_PER_DAY_LATE;
        }
    }

    if (project.revisionLimit != null && project.revisionsUsed != null) {
        const left = project.revisionLimit - project.revisionsUsed;
        if (left > 0) impact += TRUST.BONUS_REVISIONS_LEFT;
    }

    return impact;
}

/**
 * Recompute freelancer's scopeDiscipline and scopeCreepIndex from all their completed projects.
 * scopeDiscipline = % of change requests that were in-scope (100 if no CRs).
 * scopeCreepIndex = total count of out-of-scope change requests.
 */
async function updateScopeMetrics(freelancerId) {
    const completedProjects = await Project.find({
        freelancerId,
        status: 'completed',
    })
        .select('_id')
        .lean();

    const projectIds = completedProjects.map((p) => p._id);
    const crs = await ChangeRequest.find({
        projectId: { $in: projectIds },
        classification: { $in: ['in-scope', 'out-of-scope'] },
    })
        .select('classification')
        .lean();

    let inScope = 0;
    let outOfScope = 0;
    for (const cr of crs) {
        if (cr.classification === 'in-scope') inScope++;
        else outOfScope++;
    }

    const total = inScope + outOfScope;
    const scopeDiscipline = total === 0 ? 100 : Math.round((inScope / total) * 100);
    const scopeCreepIndex = outOfScope;

    await User.findByIdAndUpdate(freelancerId, {
        scopeDiscipline,
        scopeCreepIndex,
    });
}

/**
 * Apply project trust impact to freelancer's trust score and update scope metrics.
 * Also penalize the client for out-of-scope change requests they posted.
 * Call this when a project is marked complete.
 */
async function applyTrustAndScopeOnComplete(project) {
    const impact = computeTrustImpact(project);
    const freelancerId = project.freelancerId;
    const clientId = project.clientId;

    // Update freelancer trust score
    const freelancer = await User.findById(freelancerId).select('trustScore').lean();
    if (freelancer) {
        let newScore = (freelancer.trustScore || 50) + impact;
        newScore = Math.max(TRUST.TRUST_MIN, Math.min(TRUST.TRUST_MAX, Math.round(newScore)));
        await User.findByIdAndUpdate(freelancerId, { trustScore: newScore });
    }
    await updateScopeMetrics(freelancerId);

    // Penalize client for out-of-scope change requests they posted
    const outOfScopeCount = await ChangeRequest.countDocuments({
        projectId: project._id,
        classification: 'out-of-scope',
    });
    if (outOfScopeCount > 0 && clientId) {
        const client = await User.findById(clientId).select('trustScore').lean();
        if (client) {
            const penalty = outOfScopeCount * TRUST.CLIENT_PENALTY_PER_OUT_OF_SCOPE;
            let clientScore = (client.trustScore ?? 50) - penalty;
            clientScore = Math.max(TRUST.TRUST_MIN, Math.min(TRUST.TRUST_MAX, Math.round(clientScore)));
            await User.findByIdAndUpdate(clientId, { trustScore: clientScore });
        }
    }
}

module.exports = {
    computeTrustImpact,
    updateScopeMetrics,
    applyTrustAndScopeOnComplete,
    TRUST,
};
