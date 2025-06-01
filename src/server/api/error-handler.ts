/**
 * Centralized error handler for API procedures.
 * Wraps async logic and returns a consistent error response.
 */
export const handleApiError = async <T>(
    fn: () => Promise<T>
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        // Log error for observability (could use a logger here)
        // eslint-disable-next-line no-console
        console.error("API Error:", error);

        // Customize error message for client
        throw new Error(
            error instanceof Error
                ? error.message
                : "An unexpected error occurred. Please try again."
        );
    }
};