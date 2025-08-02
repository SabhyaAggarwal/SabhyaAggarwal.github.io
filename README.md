# SabhyaAggarwal.github.io

Personal portfolio website with integrated Gemini AI demo, featuring a mono-repo structure with static frontend and serverless backend.

## 🏗️ Project Structure

```
SabhyaAggarwal.github.io/
├── frontend/                    # Gemini AI demo frontend
│   └── index.html              # Interactive demo interface
├── netlify/functions/           # Serverless backend
│   └── gemini-proxy.js         # Gemini API proxy function
├── index.html                  # Main portfolio page (GitHub Pages)
├── sitemap.xml                 # Site map
├── CNAME                       # Custom domain configuration
├── netlify.toml                # Netlify deployment configuration
├── package.json                # Node.js dependencies and scripts
└── README.md                   # This file
```

## 🚀 Features

### Frontend
- **Portfolio Site**: Personal website showcasing projects and skills
- **Gemini AI Demo**: Interactive interface for testing Google's Gemini AI
- **Responsive Design**: Mobile-first approach using Tailwind CSS
- **GitHub Pages Compatible**: Static files served directly from repository

### Backend
- **Serverless Functions**: Netlify Functions for API proxy
- **Secure API Management**: API keys stored safely in environment variables
- **Error Handling**: Comprehensive error handling and user feedback
- **CORS Support**: Cross-origin requests properly configured

## 🛠️ Setup and Deployment

### Prerequisites
- Node.js 18+ (for local development)
- Netlify account (for backend deployment)
- Google AI Studio account (for Gemini API key)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/SabhyaAggarwal/SabhyaAggarwal.github.io.git
   cd SabhyaAggarwal.github.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Start local development server**
   ```bash
   npm run dev
   ```
   This will start the Netlify Dev server with functions support.

### Production Deployment

#### GitHub Pages (Frontend Only)
The main portfolio is automatically deployed to GitHub Pages from the root directory.

#### Netlify (Full Stack)
1. **Connect to Netlify**
   - Link your GitHub repository to Netlify
   - Set build command: (none needed)
   - Set publish directory: `.` (root)

2. **Configure Environment Variables**
   In your Netlify dashboard, add:
   ```
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. **Deploy**
   ```bash
   npm run deploy:prod
   ```

## 🔧 Configuration

### Netlify Functions
- **Runtime**: Node.js 18
- **Timeout**: 30 seconds
- **Bundle**: esbuild for optimal performance

### API Configuration
- **Gemini Model**: gemini-pro
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1024
- **Safety Settings**: Medium and above blocking for harmful content

## 📖 Usage

### Accessing the Demo
1. **Direct Access**: Visit `/frontend/index.html`
2. **Friendly URL**: Visit `/demo` (redirects to frontend)
3. **From Portfolio**: Click the demo link from the main page

### Using the Gemini API Demo
1. Enter your prompt in the textarea
2. Click "Send to Gemini"
3. Wait for the AI response
4. View the result in the response area

### Example Prompts
- "Explain quantum computing in simple terms"
- "Write a short poem about technology"
- "What are the benefits of serverless architecture?"
- "Create a simple JavaScript function to sort an array"

## 🔐 Security Features

- **API Key Protection**: Keys stored securely in environment variables
- **Request Validation**: Input sanitization and validation
- **Error Handling**: Detailed error messages without exposing internals
- **CORS Configuration**: Proper cross-origin request handling
- **Rate Limiting**: Handled by Gemini API and Netlify

## 🐛 Troubleshooting

### Common Issues

1. **"Server configuration error"**
   - Ensure `GEMINI_API_KEY` is set in environment variables
   - Verify the API key is valid and has proper permissions

2. **"Failed to process request"**
   - Check your internet connection
   - Verify the Netlify function is deployed correctly
   - Check function logs in Netlify dashboard

3. **CORS errors**
   - Ensure you're accessing through the proper domain
   - Check that Netlify functions are properly configured

4. **Timeout errors**
   - Try with a shorter prompt
   - Check Netlify function timeout settings

### Development Tips
- Use `netlify dev` for local testing with functions
- Check browser developer tools for client-side errors
- Monitor Netlify function logs for backend issues
- Test with various prompt lengths and types

## 📝 API Documentation

### Gemini Proxy Endpoint
**URL**: `/.netlify/functions/gemini-proxy`
**Method**: `POST`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "prompt": "Your question or prompt here"
}
```

**Success Response**:
```json
{
  "response": "AI generated response text",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response**:
```json
{
  "error": "Error description"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

## 🔗 Links

- **Live Site**: [https://sabhya.me](https://sabhya.me)
- **GitHub**: [https://github.com/SabhyaAggarwal](https://github.com/SabhyaAggarwal)
- **Google AI Studio**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
