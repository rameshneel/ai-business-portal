import Subscription from "../../models/subscription.model.js";
import Trial from "../../models/trial.model.js";
import ServiceUsage from "../../models/serviceUsage.model.js";
import User from "../../models/user.model.js";

// Subscription Analytics Service
export class SubscriptionAnalyticsService {
  // Get subscription metrics
  async getSubscriptionMetrics() {
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });
    const cancelledSubscriptions = await Subscription.countDocuments({
      status: "cancelled",
    });
    const expiredSubscriptions = await Subscription.countDocuments({
      status: "expired",
    });

    const totalTrials = await Trial.countDocuments();
    const activeTrials = await Trial.countDocuments({ status: "active" });
    const convertedTrials = await Trial.countDocuments({ status: "converted" });
    const expiredTrials = await Trial.countDocuments({ status: "expired" });

    return {
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        cancelled: cancelledSubscriptions,
        expired: expiredSubscriptions,
        activeRate:
          totalSubscriptions > 0
            ? (activeSubscriptions / totalSubscriptions) * 100
            : 0,
      },
      trials: {
        total: totalTrials,
        active: activeTrials,
        converted: convertedTrials,
        expired: expiredTrials,
        conversionRate:
          totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0,
      },
    };
  }

  // Get plan distribution
  async getPlanDistribution() {
    const planStats = await Subscription.aggregate([
      {
        $group: {
          _id: "$plan",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$amount" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return planStats;
  }

  // Get revenue metrics
  async getRevenueMetrics(period = "month") {
    const now = new Date();
    let startDate;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const revenueStats = await Subscription.aggregate([
      {
        $match: {
          status: "active",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          averageRevenue: { $avg: "$amount" },
          subscriptionCount: { $sum: 1 },
        },
      },
    ]);

    return (
      revenueStats[0] || {
        totalRevenue: 0,
        averageRevenue: 0,
        subscriptionCount: 0,
      }
    );
  }

  // Get usage analytics
  async getUsageAnalytics(service = null) {
    const matchStage = service ? { "request.type": service } : {};

    const usageStats = await ServiceUsage.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$request.type",
          totalRequests: { $sum: 1 },
          successfulRequests: {
            $sum: { $cond: ["$response.success", 1, 0] },
          },
          totalWords: { $sum: "$usage.wordsGenerated" },
          totalImages: { $sum: "$usage.imagesGenerated" },
          averageResponseTime: { $avg: "$response.responseTime" },
        },
      },
      {
        $sort: { totalRequests: -1 },
      },
    ]);

    return usageStats;
  }

  // Get user engagement metrics
  async getUserEngagementMetrics() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      "usageStats.lastUsed": {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });

    const subscriptionUsers = await Subscription.countDocuments({
      status: "active",
    });
    const trialUsers = await Trial.countDocuments({ status: "active" });

    return {
      totalUsers,
      activeUsers,
      subscriptionUsers,
      trialUsers,
      engagementRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      subscriptionRate:
        totalUsers > 0 ? (subscriptionUsers / totalUsers) * 100 : 0,
    };
  }

  // Get churn analysis
  async getChurnAnalysis() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const churnedUsers = await Subscription.countDocuments({
      status: "cancelled",
      updatedAt: { $gte: thirtyDaysAgo },
    });

    const totalActiveUsers = await Subscription.countDocuments({
      status: "active",
    });

    const churnRate =
      totalActiveUsers > 0 ? (churnedUsers / totalActiveUsers) * 100 : 0;

    return {
      churnedUsers,
      totalActiveUsers,
      churnRate,
      period: "30 days",
    };
  }

  // Get trial conversion funnel
  async getTrialConversionFunnel() {
    const totalTrials = await Trial.countDocuments();
    const convertedTrials = await Trial.countDocuments({ status: "converted" });
    const expiredTrials = await Trial.countDocuments({ status: "expired" });
    const activeTrials = await Trial.countDocuments({ status: "active" });

    return {
      totalTrials,
      activeTrials,
      convertedTrials,
      expiredTrials,
      conversionRate:
        totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0,
      expirationRate: totalTrials > 0 ? (expiredTrials / totalTrials) * 100 : 0,
    };
  }

  // Get comprehensive dashboard data
  async getDashboardData() {
    const [
      subscriptionMetrics,
      planDistribution,
      revenueMetrics,
      usageAnalytics,
      userEngagement,
      churnAnalysis,
      conversionFunnel,
    ] = await Promise.all([
      this.getSubscriptionMetrics(),
      this.getPlanDistribution(),
      this.getRevenueMetrics("month"),
      this.getUsageAnalytics(),
      this.getUserEngagementMetrics(),
      this.getChurnAnalysis(),
      this.getTrialConversionFunnel(),
    ]);

    return {
      subscriptionMetrics,
      planDistribution,
      revenueMetrics,
      usageAnalytics,
      userEngagement,
      churnAnalysis,
      conversionFunnel,
      generatedAt: new Date(),
    };
  }
}

export const subscriptionAnalyticsService = new SubscriptionAnalyticsService();
