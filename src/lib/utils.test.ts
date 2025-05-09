import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional class names', () => {
      const condition = true;
      const result = cn(
        'base-class',
        condition && 'conditional-class',
        !condition && 'not-applied'
      );
      expect(result).toBe('base-class conditional-class');
    });

    it('should handle arrays of class names', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true
      });
      expect(result).toBe('class1 class3');
    });

    it('should handle mixed inputs', () => {
      const condition = true;
      const result = cn(
        'base-class',
        ['array-class1', 'array-class2'],
        condition && 'conditional-class',
        { 'object-class1': true, 'object-class2': false }
      );
      expect(result).toBe('base-class array-class1 array-class2 conditional-class object-class1');
    });
  });
});
