// Helper function to calculate influencer payout
export function calculateInfluencerPayout(
    payoutType: string | null,
    payoutValue: number | null,
    orderTotal: number,
    discountAmount: number
): number {
    if (!payoutType || payoutType === 'none' || !payoutValue) {
        return 0;
    }

    switch (payoutType) {
        case 'percentage_of_sale':
            // Calculate percentage of the total sale amount
            return (orderTotal * payoutValue) / 100;

        case 'fixed':
            // Fixed amount per use
            return payoutValue;

        default:
            return 0;
    }
}
