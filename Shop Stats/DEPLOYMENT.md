
# Deployment Guide for Shop Stats App

This guide will help you deploy the Shop Stats App to your GitHub repository and set up automated deployment.

## Prerequisites

1. **GitHub Account**: You need access to the repository at https://github.com/kwo744-075/shop-stats-app-bzftym
2. **Expo Account**: Create an account at https://expo.dev
3. **EAS CLI**: Install globally with `npm install -g eas-cli`

## Repository Setup

### 1. Initialize Git Repository (if not already done)

```bash
git init
git remote add origin https://github.com/kwo744-075/shop-stats-app-bzftym.git
```

### 2. Commit and Push Your Code

```bash
git add .
git commit -m "Initial commit - Shop Stats App"
git push -u origin main
```

## Expo and EAS Setup

### 1. Login to Expo

```bash
npx expo login
```

### 2. Configure EAS

```bash
eas login
eas build:configure
```

### 3. Create EAS Project

```bash
eas project:init
```

## Environment Configuration

### 1. Set up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

- `EXPO_TOKEN`: Your Expo access token (get from https://expo.dev/accounts/[username]/settings/access-tokens)

### 2. Environment Variables

The app uses the following environment variables (already configured in `eas.json`):

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment Process

### Automatic Deployment (Recommended)

The app is configured with GitHub Actions for automatic deployment:

1. **Push to `develop` branch**: Triggers a preview build
2. **Push to `main` branch**: Triggers a production build and deployment

### Manual Deployment

#### Development Build
```bash
eas build --platform all --profile development
```

#### Preview Build
```bash
eas build --platform all --profile preview
```

#### Production Build
```bash
eas build --platform all --profile production
```

#### Deploy Updates
```bash
eas update --branch production --message "Your update message"
```

## Testing the Deployment

### 1. Install Expo Go App

- iOS: Download from App Store
- Android: Download from Google Play Store

### 2. Test Development Build

```bash
npx expo start --tunnel
```

Scan the QR code with Expo Go app.

### 3. Test Production Build

After successful build, you'll receive a link to install the app on your device.

## Troubleshooting

### Common Issues

1. **Build Fails**: Check the GitHub Actions logs for detailed error messages
2. **Environment Variables**: Ensure all required secrets are set in GitHub
3. **Supabase Connection**: Verify your Supabase URL and keys are correct

### Debugging Steps

1. Check GitHub Actions workflow status
2. Review EAS build logs: `eas build:list`
3. Test locally: `npx expo start`
4. Verify environment variables in `eas.json`

## App Store Deployment

### iOS App Store

1. Build for iOS: `eas build --platform ios --profile production`
2. Submit to App Store: `eas submit --platform ios`

### Google Play Store

1. Build for Android: `eas build --platform android --profile production`
2. Submit to Play Store: `eas submit --platform android`

## Monitoring and Updates

### Over-the-Air Updates

Use EAS Update for quick fixes and feature updates:

```bash
eas update --branch production --message "Bug fixes and improvements"
```

### Analytics

Monitor your app's performance through:
- Expo Analytics Dashboard
- GitHub Actions build history
- Supabase Dashboard for database metrics

## Support

For deployment issues:
1. Check the GitHub repository issues
2. Review Expo documentation: https://docs.expo.dev
3. Check Supabase documentation: https://supabase.com/docs

## Security Notes

- Never commit sensitive keys to the repository
- Use GitHub Secrets for all sensitive configuration
- Regularly rotate API keys and tokens
- Monitor Supabase usage and access logs
