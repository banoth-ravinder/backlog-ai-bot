import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

beforeAll(() => {
  // Start the MSW server before all tests
  server.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  // Close the MSW server after all tests
  server.close();
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();
});