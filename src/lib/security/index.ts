
/**
 * Security-related utility functions
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Replace dangerous HTML characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .trim();
  }