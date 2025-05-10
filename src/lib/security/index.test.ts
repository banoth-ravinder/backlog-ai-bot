import { describe, it, expect } from 'vitest';
import { sanitizeInput } from './index';

describe('sanitizeInput', () => {
  it('should return an empty string if input is null or undefined', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput(null as unknown as string)).toBe('');
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
  });

  it('should sanitize input by replacing dangerous HTML characters', () => {
    const input = `<script>alert("XSS")</script>`;
    const sanitized = sanitizeInput(input);
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should trim leading and trailing spaces', () => {
    const input = '   <b>Test</b>   ';
    const sanitized = sanitizeInput(input);
    expect(sanitized).toBe('&lt;b&gt;Test&lt;/b&gt;');
  });

  it('should handle single and double quotes correctly', () => {
    const input = `'"Test"'`;
    const sanitized = sanitizeInput(input);
    expect(sanitized).toBe('&#039;&quot;Test&quot;&#039;');
  });

  it('should not modify safe strings', () => {
    const input = 'Hello, World!';
    const sanitized = sanitizeInput(input);
    expect(sanitized).toBe('Hello, World!');
  });
});