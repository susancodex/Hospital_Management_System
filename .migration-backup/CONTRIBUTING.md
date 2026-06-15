# Contributing to Hospital Management System

Thank you for your interest in contributing! Please follow these guidelines.

## Code of Conduct

- Be respectful and inclusive
- Focus on code quality and functionality
- Document your changes
- Test before submitting

## Development Setup

```bash
# Clone and setup
git clone <repository>
cd hospital-management-system
./scripts/setup.sh

# Or with Docker
docker-compose up -d
```

## Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   git checkout -b fix/issue-description
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature" # or "fix:", "docs:", etc.
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Submit Pull Request**
   - Describe changes clearly
   - Reference related issues
   - Ensure all tests pass

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code style (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance

### Examples
```
feat(appointments): add appointment reminders
fix(auth): resolve JWT token expiration bug
docs(api): update endpoint documentation
style(frontend): format component files
```

## Code Style

### Python (Backend)
```python
# Follow PEP 8
# Use type hints where applicable
def get_user_by_id(user_id: int) -> User | None:
    """Get user by ID or None if not found."""
    return User.objects.filter(id=user_id).first()
```

- Line length: 88 characters (black formatter)
- Docstrings for all functions/classes
- Import order: stdlib, third-party, local

### JavaScript/React (Frontend)
```javascript
// Use consistent naming
const getUserAppointments = async (userId) => {
  const response = await api.get(`/users/${userId}/appointments`);
  return response.data;
};

// Functional components preferred
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  // ...
}
```

- Use React Hooks, avoid class components
- Functional components preferred
- PropTypes or TypeScript for type checking
- Consistent naming conventions

## Testing

### Backend
```bash
# Run all tests
cd backend
python manage.py test

# Run specific test
python manage.py test core.tests.UserTests

# With coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend
```bash
# Add tests in __tests__ or .test.js files
# Run tests (when configured)
npm test
```

**New features must include tests.**

## Before Submitting PR

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated if needed
- [ ] No console warnings/errors
- [ ] Commits are clean and well-message
- [ ] No sensitive data committed
- [ ] `.env` files not included

## Pull Request Process

1. Update README.md if needed
2. Ensure all tests pass
3. Link related issues
4. Request review from maintainers
5. Address review comments
6. Squash commits if requested

## Reporting Bugs

**Use GitHub Issues** with:
- Clear title
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Python/Node version)
- Screenshots/logs if applicable

Example:
```markdown
## Bug Report

**Title**: Authentication fails with special characters in password

**Environment**:
- OS: macOS 14
- Python: 3.12
- Node: 20

**Steps to Reproduce**:
1. Create user with password: `P@ssw0rd!#$`
2. Login with credentials
3. Observe error

**Expected**: User logs in successfully
**Actual**: 401 Unauthorized error

**Error Log**:
```
Error: Invalid token
```
```

## Suggesting Features

Create an issue with:
- Clear description of feature
- Use case and motivation
- Proposed solution (optional)
- Alternatives considered

## Performance Considerations

- Use database indexing for frequently queried fields
- Implement pagination for list endpoints
- Cache expensive operations
- Optimize frontend renders (React.memo for expensive components)
- Use production builds for testing

## Security

- Never commit secrets or API keys
- Validate all user input
- Use Django's security features
- Follow OWASP guidelines
- Report security issues privately

## Documentation

- Update docstrings when changing code
- Add comments for complex logic
- Update README.md for major changes
- Document new API endpoints
- Include usage examples

## Questions?

- Check existing issues/PRs
- Read documentation
- Create a discussion issue
- Contact maintainers

## License

By contributing, you agree your code is licensed under MIT License.

---

Thank you for contributing! 🎉
