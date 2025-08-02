const axios = require('axios');

/**
 * Netlify Functions handler for proxying requests to Google's Gemini API
 * This function securely handles API key management and request forwarding
 */
exports.handler = async (event, context) => {
    // Set CORS headers for browser requests
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                error: 'Method not allowed. Use POST.'
            })
        };
    }

    try {
        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid JSON in request body'
                })
            };
        }

        // Validate required fields
        const { prompt } = requestBody;
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Prompt is required and must be a non-empty string'
                })
            };
        }

        // Check for API key in environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Server configuration error. Please contact the administrator.'
                })
            };
        }

        // Prepare Gemini API request
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const geminiRequestBody = {
            contents: [{
                parts: [{
                    text: prompt.trim()
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        // Make request to Gemini API
        console.log('Making request to Gemini API...');
        const geminiResponse = await axios.post(geminiApiUrl, geminiRequestBody, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        // Extract response text from Gemini API response
        const candidates = geminiResponse.data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No response generated from Gemini API');
        }

        const responseText = candidates[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error('Invalid response format from Gemini API');
        }

        // Return successful response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                response: responseText,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error in gemini-proxy function:', error);

        // Handle different types of errors
        if (error.response) {
            // Gemini API returned an error response
            const status = error.response.status;
            const errorMessage = error.response.data?.error?.message || 'Gemini API error';
            
            console.error('Gemini API Error:', {
                status,
                message: errorMessage,
                data: error.response.data
            });

            return {
                statusCode: status >= 400 && status < 500 ? 400 : 500,
                headers,
                body: JSON.stringify({
                    error: status === 429 
                        ? 'Rate limit exceeded. Please try again later.'
                        : status === 403
                        ? 'API access forbidden. Please check API key configuration.'
                        : 'Failed to process request with Gemini API'
                })
            };
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            // Timeout error
            return {
                statusCode: 504,
                headers,
                body: JSON.stringify({
                    error: 'Request timeout. Please try again with a shorter prompt.'
                })
            };
        } else {
            // General server error
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Internal server error. Please try again later.'
                })
            };
        }
    }
};