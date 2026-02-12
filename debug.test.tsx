// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect } from 'vitest';

describe('debug', () => {
    it('renderHook works', () => {
        const { result } = renderHook(() => useState(0));
        expect(result.current[0]).toBe(0);
    });
});
