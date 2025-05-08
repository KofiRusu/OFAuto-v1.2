# V0.dev Frontend Development Guide

This guide provides instructions for using V0.dev to accelerate frontend development for the OFAuto project.

## What is V0.dev?

[V0.dev](https://v0.dev) is Vercel's AI-powered UI design and generation tool that enables rapid prototyping and component creation using natural language prompts.

## Getting Started

1. Visit [V0.dev](https://v0.dev) and sign in with your Vercel account
2. Familiarize yourself with the prompt interface
3. Start with small components before attempting complex layouts

## Best Practices for OFAuto Components

### Component Style Guidelines

When creating components with V0.dev, follow these guidelines to maintain consistency:

1. Use the existing color scheme:
   - Primary: `#0070f3` (blue)
   - Secondary: `#f5f5f5` (light gray)
   - Accent: `#ff4081` (pink)

2. Match existing component structure:
   - Use Tailwind CSS for styling
   - Follow the project's naming conventions
   - Implement responsive designs

### Example Prompts

#### Campaign Card Component

```
Create a card component for an OnlyFans campaign with the following:
- A header with campaign name and status badge (active/paused)
- Campaign stats including subscriber count and revenue
- A clean, modern design using Tailwind CSS
- Progress indicators for campaign goals
- Action buttons for edit, pause, and delete
- Mobile responsive design
```

#### Form Components

```
Design a form input component with:
- Label above the input
- Error state with red outline and message below
- Helper text option
- Disabled state with lighter colors
- Compatible with React Hook Form
- Using Tailwind CSS
```

## Integration Process

After generating a component with V0.dev:

1. Review and customize the generated code
2. Extract the component into its own file in the appropriate directory
3. Replace hardcoded values with props and dynamic data
4. Add TypeScript types for all props
5. Test the component in various screen sizes
6. Integrate with data fetching logic as needed

## Best Practices for Prompting

1. **Be specific**: Include details about layout, functionality, and styling
2. **Reference existing components**: Ask for components that match your existing design system
3. **Iterative refinement**: Use the results as a starting point and refine with additional prompts
4. **One component at a time**: Focus on creating individual components rather than entire pages

## Example Workflow

1. Identify a UI need in the OFAuto project
2. Create a prompt for V0.dev describing the component
3. Generate and customize the component
4. Extract the component into your project
5. Add necessary props, types, and functionality
6. Test and refine the component
7. Document the component's usage in the project

## Tips for Complex UI

For more complex UI elements:

1. Break down the UI into smaller components
2. Generate each component separately
3. Compose the components together in your codebase
4. Use React's composition patterns to combine components

## Resources

- [V0.dev Documentation](https://v0.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [React UI Patterns](https://reactpatterns.com/) 