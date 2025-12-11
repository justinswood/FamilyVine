# Testing Documentation

This document outlines the testing infrastructure and practices for the FamilyVine project.

## Backend Testing

### Setup

Backend tests use Jest and Supertest for unit and integration testing.

**Install dependencies:**
```bash
cd backend
sudo chown -R $USER:$USER node_modules  # Fix permissions if needed
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are located in the `__tests__` directory, organized by type:
- `__tests__/services/` - Service layer unit tests
- `__tests__/utils/` - Utility function tests
- `__tests__/middleware/` - Middleware tests

### Writing Tests

Example test file structure:
```javascript
const { functionToTest } = require('../../path/to/module');

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should do something', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking

Database connections and external dependencies are mocked:
```javascript
jest.mock('../../config/database');
const pool = require('../../config/database');
pool.query.mockResolvedValue({ rows: [] });
```

## Frontend Testing

### Setup

Frontend tests use React Testing Library and Jest (included with react-scripts).

**Install dependencies:**
```bash
cd frontend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (interactive)
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### Test Structure

Tests are co-located with components:
- `src/components/__tests__/` - Component tests
- `src/utils/__tests__/` - Utility function tests
- `src/pages/__tests__/` - Page component tests

### Writing Component Tests

Example component test:
```javascript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Test Coverage Goals

We aim for the following test coverage:
- **Branches**: 50%+
- **Functions**: 50%+
- **Lines**: 50%+
- **Statements**: 50%+

## Current Test Files

### Backend
- ✅ `__tests__/utils/dateUtils.test.js` - Date utility functions (comprehensive)
- ✅ `__tests__/services/memberService.test.js` - Member service operations
- ✅ `__tests__/middleware/auth.test.js` - Authentication middleware

### Frontend
- ✅ `components/__tests__/MemberCard.test.js` - MemberCard component
- ✅ `utils/__tests__/dateUtils.test.js` - Date utility functions

## Next Steps

1. Add integration tests for API routes
2. Add more component tests for critical UI components
3. Add E2E tests using Cypress or Playwright
4. Set up CI/CD pipeline to run tests automatically

## Troubleshooting

### Backend Permission Issues

If you encounter permission errors when installing packages:
```bash
sudo chown -R $USER:$USER /opt/familyvine/backend/node_modules
```

### Frontend Test Failures

If tests fail due to missing mocks, check `src/setupTests.js` for required global mocks.

### Database Connection Errors

Tests use mocked database connections. If you see connection errors, ensure the mock is properly configured in `jest.setup.js`.

## CI/CD Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run backend tests
  run: |
    cd backend
    npm install
    npm test -- --coverage

- name: Run frontend tests
  run: |
    cd frontend
    npm install
    npm test -- --coverage --watchAll=false
```
