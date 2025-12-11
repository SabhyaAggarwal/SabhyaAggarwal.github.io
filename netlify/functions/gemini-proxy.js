const axios = require('axios');

/**
 * Netlify Functions handler for proxying requests to Google's Gemini API
 * This function securely handles API key management and request forwarding
 * Updated to use gemini-2.5-flash model.
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
                error: 'Method not allowed. Use POST.',
                errorCode: 'METHOD_NOT_ALLOWED',
                errorType: 'validation',
                details: {
                    allowedMethods: ['POST', 'OPTIONS'],
                    receivedMethod: event.httpMethod
                },
                suggestion: 'Please use POST method to send your prompt to the API.'
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
                    error: 'Invalid JSON in request body',
                    errorCode: 'INVALID_JSON',
                    errorType: 'validation',
                    details: {
                        parseError: parseError.message,
                        receivedBody: event.body ? event.body.substring(0, 100) + '...' : 'empty'
                    },
                    suggestion: 'Please ensure your request body contains valid JSON with a "prompt" field.'
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
                    error: 'Prompt is required and must be a non-empty string',
                    errorCode: 'INVALID_PROMPT',
                    errorType: 'validation',
                    details: {
                        promptType: typeof prompt,
                        promptLength: prompt ? prompt.length : 0,
                        isEmpty: !prompt || prompt.trim().length === 0
                    },
                    suggestion: 'Please provide a valid prompt string with at least one character.'
                })
            };
        }

        // Additional prompt validation
        if (prompt.trim().length > 10000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Prompt is too long. Maximum length is 10,000 characters.',
                    errorCode: 'PROMPT_TOO_LONG',
                    errorType: 'validation',
                    details: {
                        promptLength: prompt.length,
                        maxLength: 10000,
                        exceededBy: prompt.length - 10000
                    },
                    suggestion: 'Please shorten your prompt to under 10,000 characters.'
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
                    error: 'Server configuration error. Please contact the administrator.',
                    errorCode: 'MISSING_API_KEY',
                    errorType: 'configuration',
                    details: {
                        configurationIssue: 'GEMINI_API_KEY environment variable not configured',
                        timestamp: new Date().toISOString()
                    },
                    suggestion: 'The server administrator needs to configure the Gemini API key in the environment variables.'
                })
            };
        }

        // Prepare Gemini API request (using gemini-2.5-flash model)
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
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
            console.error('No candidates in Gemini response:', geminiResponse.data);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'No response generated from Gemini API',
                    errorCode: 'NO_CANDIDATES',
                    errorType: 'api_response',
                    details: {
                        responseData: geminiResponse.data,
                        candidatesLength: candidates ? candidates.length : 0,
                        timestamp: new Date().toISOString()
                    },
                    suggestion: 'The AI model did not generate a response. Try rephrasing your prompt or try again later.'
                })
            };
        }

        const responseText = candidates[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            console.error('Invalid response format from Gemini:', candidates[0]);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Invalid response format from Gemini API',
                    errorCode: 'INVALID_RESPONSE_FORMAT',
                    errorType: 'api_response',
                    details: {
                        candidate: candidates[0],
                        timestamp: new Date().toISOString()
                    },
                    suggestion: 'The AI response was in an unexpected format. Please try again.'
                })
            };
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

        // Handle different types of errors with detailed information
        if (error.response) {
            // Gemini API returned an error response
            const status = error.response.status;
            const errorData = error.response.data;
            const errorMessage = errorData?.error?.message || 'Gemini API error';
            
            console.error('Gemini API Error:', {
                status,
                message: errorMessage,
                data: errorData
            });

            let detailedError = {
                error: 'Failed to process request with Gemini API',
                errorCode: 'GEMINI_API_ERROR',
                errorType: 'external_api',
                details: {
                    httpStatus: status,
                    apiError: errorMessage,
                    timestamp: new Date().toISOString()
                },
                suggestion: 'There was an issue with the AI service. Please try again later.'
            };

            // Provide specific error handling for common status codes
            if (status === 429) {
                detailedError.error = 'Rate limit exceeded. Please try again later.';
                detailedError.errorCode = 'RATE_LIMIT_EXCEEDED';
                detailedError.suggestion = 'You have made too many requests. Please wait a few minutes before trying again.';
                detailedError.details.retryAfter = '5 minutes';
            } else if (status === 403) {
                detailedError.error = 'API access forbidden. Please check API key configuration.';
                detailedError.errorCode = 'API_ACCESS_FORBIDDEN';
                detailedError.suggestion = 'The API key may be invalid or expired. Please contact the administrator.';
            } else if (status === 400) {
                detailedError.error = 'Bad request to Gemini API';
                detailedError.errorCode = 'BAD_REQUEST';
                detailedError.suggestion = 'Your prompt may contain unsupported content. Try rephrasing your request.';
                detailedError.details.requestIssue = errorData?.error?.details || 'Invalid request format';
            } else if (status === 404) {
                detailedError.error = 'Gemini API endpoint not found';
                detailedError.errorCode = 'API_ENDPOINT_NOT_FOUND';
                detailedError.suggestion = 'The AI service endpoint is not available. Please contact the administrator.';
            } else if (status >= 500) {
                detailedError.error = 'Gemini API server error';
                detailedError.errorCode = 'GEMINI_SERVER_ERROR';
                detailedError.suggestion = 'The AI service is experiencing issues. Please try again later.';
            }

            return {
                statusCode: status >= 400 && status < 500 ? 400 : 500,
                headers,
                body: JSON.stringify(detailedError)
            };
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            // Timeout error
            return {
                statusCode: 504,
                headers,
                body: JSON.stringify({
                    error: 'Request timeout. Please try again with a shorter prompt.',
                    errorCode: 'REQUEST_TIMEOUT',
                    errorType: 'timeout',
                    details: {
                        timeoutDuration: '30 seconds',
                        errorCode: error.code,
                        timestamp: new Date().toISOString()
                    },
                    suggestion: 'Your request took too long to process. Try with a shorter prompt or try again later.'
                })
            };
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            // Network connectivity issues
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({
                    error: 'Unable to connect to Gemini API',
                    errorCode: 'NETWORK_ERROR',
                    errorType: 'connectivity',
                    details: {
                        networkError: error.code,
                        message: error.message,
                        timestamp: new Date().toISOString()
                    },
                    suggestion: 'There seems to be a network connectivity issue. Please try again later.'
                })
            };
        } else {
            // General server error
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Internal server error. Please try again later.',
                    errorCode: 'INTERNAL_SERVER_ERROR',
                    errorType: 'server',
                    details: {
                        errorMessage: error.message,
                        errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                        timestamp: new Date().toISOString()
                    },
                    suggestion: 'An unexpected error occurred on the server. Please try again or contact support if the issue persists.'
                })
            };
        }
    }
};
