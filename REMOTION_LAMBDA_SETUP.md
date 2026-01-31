# Remotion Lambda Setup for VidAI

This guide configures Remotion Lambda for server-side video rendering with your 3 segments, logo, and captions.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured locally
3. Remotion license (free for individuals/small companies)

## Step 1: Install Remotion Lambda CLI

```bash
npm install -g @remotion/lambda
```

## Step 2: Set Up AWS Credentials

Configure your AWS credentials:

```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

## Step 3: Deploy Remotion Lambda Function

```bash
npx remotion lambda functions deploy --region=us-east-1
```

This creates a Lambda function for rendering videos.

## Step 4: Create Remotion Site

Build and deploy your Remotion composition as a site:

```bash
# Build the site
npx remotion build --entry=src/remotion/index.ts

# Deploy to S3
npx remotion sites create --region=us-east-1 --site-name=vidai-composition
```

You'll get a serveUrl like:
```
https://remotionlambda-xxx.s3.us-east-1.amazonaws.com/sites/vidai-composition
```

## Step 5: Configure Environment Variables

Add these to your `.env.local`:

```bash
# Remotion Lambda Configuration
REMOTION_AWS_ACCESS_KEY_ID=your_aws_access_key
REMOTION_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
REMOTION_AWS_REGION=us-east-1
REMOTION_SERVE_URL=https://your-deployed-site-url
REMOTION_FUNCTION_NAME=remotion-render-xxxxx
```

And to your Convex Dashboard environment variables:
```
REMOTION_AWS_ACCESS_KEY_ID
REMOTION_AWS_SECRET_ACCESS_KEY
REMOTION_AWS_REGION
REMOTION_SERVE_URL
REMOTION_FUNCTION_NAME
```

## Step 6: Test Rendering

Once set up, the `renderVideo` action will:
1. Get your 3 generated segments
2. Trigger Remotion Lambda to render the composition
3. Apply logo and caption overlays
4. Output a final 18-second MP4

## Architecture

```
Frontend (VideoEditor) 
  ↓ calls renderVideo action
Convex Action (renderVideo)
  ↓ invokes
Remotion Lambda
  ↓ renders
S3 Bucket (output video)
  ↓ saved to
Convex Storage (final video)
```

## Troubleshooting

**Error: Function not found**
- Make sure you deployed the Lambda function with `npx remotion lambda functions deploy`

**Error: Site not accessible**
- Verify your serveUrl is correct and the site is deployed
- Check S3 bucket permissions

**Timeout errors**
- Increase Lambda timeout: `npx remotion lambda functions deploy --timeout=300`
- For 18s videos with overlays, use at least 2048MB memory

## Alternative: Cloudflare R2 Storage

If you prefer Cloudflare R2 over AWS S3:

```typescript
const result = await renderMediaOnLambda({
  serveUrl: process.env.REMOTION_SERVE_URL,
  functionName: process.env.REMOTION_FUNCTION_NAME,
  composition: 'VideoComposition',
  region: 'us-east-1',
  inputProps: {
    segmentUrls: ['url1', 'url2', 'url3'],
    logoUrl: '...',
    captions: [...],
  },
  codec: 'h264',
  outName: {
    key: 'output.mp4',
    bucketName: 'your-r2-bucket',
    s3OutputProvider: {
      endpoint: 'https://your-account.r2.cloudflarestorage.com',
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  },
});
```

## Cost Estimate

- Lambda invocation: ~$0.0002 per render
- S3 storage: ~$0.023 per GB/month
- Data transfer: ~$0.09 per GB

For 1000 videos/month: ~$5-10 total

## Next Steps

1. Complete the AWS setup above
2. Update `convex/actions.ts` with your actual credentials
3. Test with a small video first
4. Monitor CloudWatch logs for debugging
