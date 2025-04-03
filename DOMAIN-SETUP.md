# Setting Up Your Custom Domain (jobtrakr.co.uk)

This guide will walk you through connecting your custom domain `jobtrakr.co.uk` to your JobTrakr application. I'll cover the setup process for the most popular hosting platforms.

## Prerequisites

1. You've purchased the domain `jobtrakr.co.uk`
2. You have access to the domain's DNS settings through your domain registrar
3. Your application is built and ready to deploy

## Option 1: Deploying with Vercel (Recommended)

Vercel is one of the easiest platforms to use with React applications and custom domains.

### Step 1: Deploy your application to Vercel

1. Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:

   ```bash
   vercel login
   ```

3. Deploy your application from the project root:

   ```bash
   vercel
   ```

4. Follow the prompts to create a new project. You can accept the defaults for most settings.

### Step 2: Add your custom domain in Vercel

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your JobTrakr project
3. Go to the "Settings" tab
4. Click on "Domains"
5. Enter `jobtrakr.co.uk` and click "Add"
6. Vercel will provide you with DNS records to configure (typically either a CNAME or A record)

### Step 3: Configure DNS at your domain registrar

1. Log in to your domain registrar (where you purchased `jobtrakr.co.uk`)
2. Find the DNS management section
3. Add the DNS records provided by Vercel:
   - For A record: Point to the IP address provided by Vercel
   - For CNAME record: Set it to the value Vercel provided (like `cname.vercel-dns.com`)
4. Save your DNS settings

DNS changes typically take 24-48 hours to fully propagate, but often work much faster.

## Option 2: Deploying with Netlify

Netlify is another popular option for hosting React applications.

### Step 1: Deploy your application to Netlify

1. Install the Netlify CLI:

   ```bash
   npm install -g netlify-cli
   ```

2. Log in to Netlify:

   ```bash
   netlify login
   ```

3. Create a build of your application:

   ```bash
   npm run build
   ```

4. Deploy your application:
   ```bash
   netlify deploy --prod
   ```

### Step 2: Add your custom domain in Netlify

1. Go to the [Netlify Dashboard](https://app.netlify.com/)
2. Select your JobTrakr site
3. Go to "Site settings" > "Domain management"
4. Click "Add custom domain"
5. Enter `jobtrakr.co.uk` and click "Verify"
6. Click "Add domain"

### Step 3: Configure DNS

You have two options:

**Option A: Use Netlify DNS (Recommended)**

1. In your Netlify site's Domain settings, click "Set up Netlify DNS" next to your domain
2. Follow the instructions to update your nameservers at your domain registrar

**Option B: Configure DNS at your registrar**

1. Get the DNS settings from Netlify (usually a CNAME record)
2. Add them to your domain registrar's DNS settings

## Option 3: Deploying with GitHub Pages

GitHub Pages is a free hosting option for static sites.

### Step 1: Prepare your application for GitHub Pages

1. Add the `homepage` field to your `package.json`:

   ```json
   "homepage": "https://jobtrakr.co.uk"
   ```

2. Install the GitHub Pages package:

   ```bash
   npm install --save-dev gh-pages
   ```

3. Add deploy scripts to your `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

### Step 2: Deploy to GitHub Pages

1. Create a GitHub repository for your project (if you haven't already)
2. Push your code to GitHub
3. Run the deploy command:
   ```bash
   npm run deploy
   ```

### Step 3: Configure your custom domain with GitHub Pages

1. In your GitHub repository, go to Settings > Pages
2. Under "Custom domain", enter `jobtrakr.co.uk` and click Save
3. Check "Enforce HTTPS" if you want to use HTTPS (recommended)

### Step 4: Configure DNS at your domain registrar

Add these records to your domain's DNS settings:

- A Records:
  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```
- Or a CNAME record pointing to your GitHub Pages URL

## Option 4: Deploying with Firebase Hosting

Firebase Hosting is a fast and secure hosting option from Google.

### Step 1: Set up Firebase

1. Install the Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:

   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init hosting
   ```
   - Select "Create a new project" or use an existing one
   - Set "dist" as your public directory
   - Configure as a single-page app

### Step 2: Deploy to Firebase

1. Build your application:

   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Step 3: Add your custom domain

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Hosting > Add custom domain
4. Enter `jobtrakr.co.uk` and follow the verification steps
5. Firebase will provide DNS records to add to your domain registrar

## Troubleshooting

### DNS Propagation

If your domain is not working after configuration, remember that DNS changes can take up to 48 hours to fully propagate. You can check propagation status using tools like [DNSChecker](https://dnschecker.org/).

### SSL Certificate Issues

Most hosting providers will automatically provision SSL certificates for your domain. If you're having issues with HTTPS:

- Ensure your DNS is correctly configured
- Check if your hosting provider has any specific requirements for SSL setup
- You may need to manually renew or obtain an SSL certificate in some cases

### Subdomain vs Root Domain

Make sure you're configuring the correct type of DNS record:

- Root domain (`jobtrakr.co.uk`): Typically uses A records or ALIAS/ANAME records
- Subdomains (`www.jobtrakr.co.uk`): Typically use CNAME records

## Next Steps

After connecting your domain:

1. **Add proper `<meta>` tags** to your app for SEO
2. **Set up Google Analytics** to track site traffic
3. **Submit your site to search engines** using Google Search Console and Bing Webmaster Tools
4. **Check your site performance** using tools like Lighthouse
