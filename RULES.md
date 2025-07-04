# Training Center UI Project Rules

## Project Overview
This is a Next.js-based Training Center application with a modern UI architecture. The project is built on a foundation of a seafarer management system but adapted for training center purposes.

## Directory Structure
```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard views
│   ├── attendees/         # Attendee management
│   ├── login/            # Authentication
│   ├── auth/             # Auth-related pages
│   ├── about/            # About section
│   └── (main)/           # Main layout group
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── profile-views/    # Profile-related components
│   ├── metric-cards/     # Dashboard metrics
│   ├── forms/            # Form components
│   ├── dialogs/          # Modal dialogs
│   ├── landing/          # Landing page components
│   └── auth/             # Authentication components
├── lib/                  # Utility functions and configurations
├── types/                # TypeScript type definitions
├── services/             # Business logic and API services
├── hooks/                # Custom React hooks
├── context/              # React context providers
└── styles/               # Global styles and Tailwind config
```

## Development Rules

### 1. Component Structure
- Keep components modular and reusable
- Follow the existing directory structure
- Use TypeScript for type safety
- Implement proper error handling
- Use proper component naming conventions (PascalCase)
- Keep components focused and single-responsibility

### 2. UI/UX Guidelines
- Use the existing UI component library
- Maintain consistent styling with Tailwind CSS
- Follow the established theme system
- Ensure responsive design
- Use proper spacing and layout components
- Maintain accessibility standards
- Follow the established color scheme

### 3. Code Organization
- Keep business logic in services
- Use hooks for shared functionality
- Maintain proper type definitions
- Follow the established file naming conventions
- Keep related files together
- Use proper file structure for features

### 4. Authentication
- Use the existing auth system
- Implement proper route protection
- Handle user sessions correctly
- Maintain security best practices
- Use proper token management
- Implement proper error handling for auth

### 5. Data Management
- Use proper API integration
- Implement proper error handling
- Maintain data consistency
- Use appropriate caching strategies
- Handle loading states properly
- Implement proper data validation

### 6. Performance
- Implement proper loading states
- Use Next.js features for optimization
- Maintain good code splitting
- Optimize images and assets
- Use proper lazy loading
- Implement proper caching

### 7. Testing & Quality
- Write maintainable code
- Follow TypeScript best practices
- Implement proper error boundaries
- Maintain code documentation
- Use proper type checking
- Follow ESLint rules

### 8. State Management
- Use React hooks for local state
- Implement proper context usage
- Maintain clean data flow
- Handle side effects properly
- Use proper state initialization
- Implement proper state updates

### 9. Routing
- Follow Next.js App Router conventions
- Implement proper route protection
- Handle dynamic routes correctly
- Maintain clean URL structure
- Use proper route parameters
- Implement proper navigation

### 10. Styling
- Use Tailwind CSS consistently
- Follow the established design system
- Maintain responsive design
- Use proper CSS organization
- Follow the established spacing system
- Use proper color variables

## Technology Stack
- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- React
- Custom UI Components
- Authentication System

## Best Practices
1. Always use TypeScript for type safety
2. Follow the established component patterns
3. Maintain consistent code style
4. Use proper error handling
5. Implement proper loading states
6. Follow accessibility guidelines
7. Maintain proper documentation
8. Use proper naming conventions
9. Follow the established folder structure
10. Maintain proper code organization

## Code Style
- Use TypeScript for all components
- Follow ESLint configuration
- Use proper indentation
- Follow proper naming conventions
- Use proper comments
- Follow proper file organization

## Documentation
- Maintain proper component documentation
- Document complex logic
- Use proper JSDoc comments
- Document API integrations
- Maintain proper README files
- Document setup instructions 