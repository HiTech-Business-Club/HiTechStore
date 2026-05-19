# Contribution Guide

Thank you for considering contributing to HiTech Store! This document outlines the guidelines for contributing.

## How to Contribute

### Reporting Bugs
1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include steps to reproduce and expected behavior

### Suggesting Features
1. Check the roadmap and existing issues
2. Describe the feature in detail
3. Explain why this feature would be useful

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure linting passes
5. Commit with clear messages
6. Push to your fork
7. Submit a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/HiTech-Business-Club/HiTechStore.git
cd HiTechStore

# Install dependencies
cd backend && npm install

# Copy environment file
cp backend/.env.example backend/.env

# Start development server
npm run seed && npm start
```

## Code Style

- Use 2 spaces for indentation
- Use meaningful variable names
- Add comments for complex logic
- Follow existing patterns in the codebase

## Testing

Run tests before submitting:
```bash
cd backend && npm test
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.