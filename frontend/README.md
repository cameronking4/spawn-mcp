# MCP SSE Server Frontend

This is the frontend application for the MCP SSE Server, built with Next.js, NextAuth.js, and shadcn/ui.

## Features

- **Authentication**: Secure authentication with NextAuth.js, supporting GitHub and Google OAuth providers.
- **Dashboard**: A comprehensive dashboard for managing MCP configurations and SSE endpoints.
- **Configuration Management**: Create, edit, and delete MCP server configurations.
- **SSE Testing**: Test your SSE endpoints directly from the dashboard.
- **Documentation**: Built-in documentation for using the MCP SSE Server.

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
# NextAuth.js
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production

# OAuth Providers
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3002](http://localhost:3002).

## Project Structure

- `app/`: Next.js app directory
  - `api/`: API routes
  - `auth/`: Authentication pages
  - `dashboard/`: Dashboard pages
- `components/`: React components
  - `auth/`: Authentication components
  - `mcp/`: MCP-specific components
  - `ui/`: UI components from shadcn/ui
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions

## Authentication

This application uses NextAuth.js for authentication. To set up OAuth providers:

1. **GitHub**:
   - Go to GitHub Developer Settings > OAuth Apps > New OAuth App
   - Set the callback URL to `http://localhost:3002/api/auth/callback/github`
   - Copy the Client ID and Client Secret to your `.env.local` file

2. **Google**:
   - Go to Google Cloud Console > APIs & Services > Credentials
   - Create an OAuth 2.0 Client ID
   - Set the authorized redirect URI to `http://localhost:3002/api/auth/callback/google`
   - Copy the Client ID and Client Secret to your `.env.local` file

## Deployment

### Build for Production

```bash
npm run build
# or
yarn build
```

### Start Production Server

```bash
npm run start
# or
yarn start
```

## License

This project is licensed under the MIT License.
