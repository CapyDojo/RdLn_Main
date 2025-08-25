// Test file to check if environment variables are accessible
console.log('Testing environment variables:');
console.log('process.env.REACT_APP_POSTHOG_API_KEY:', process.env.REACT_APP_POSTHOG_API_KEY);
console.log('process.env.VITE_POSTHOG_API_KEY:', import.meta.env.VITE_POSTHOG_API_KEY);
console.log('import.meta.env:', import.meta.env);