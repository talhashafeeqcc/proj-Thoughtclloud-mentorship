import React, { useState } from 'react';
import { runIntegrationTests, testFirebaseConnection, testStripeIntegration } from '../services/test/integrationTest';

const TestPage: React.FC = () => {
    const [results, setResults] = useState<{
        firebase?: boolean;
        stripe?: boolean;
        success?: boolean;
    }>({});
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    // Override console.log to capture output
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    const setupConsoleCapture = () => {
        console.log = (...args) => {
            originalConsoleLog(...args);
            setLog(prev => [...prev, args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')]);
        };

        console.error = (...args) => {
            originalConsoleError(...args);
            setLog(prev => [...prev, `ERROR: ${args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')}`]);
        };
    };

    const restoreConsole = () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    };

    const handleRunAll = async () => {
        setLoading(true);
        setLog([]);
        setupConsoleCapture();

        try {
            setLog(['Running all integration tests...']);
            const result = await runIntegrationTests();
            setResults(result);
        } catch (error) {
            console.error('Test execution error:', error);
        } finally {
            restoreConsole();
            setLoading(false);
        }
    };

    const handleRunFirebase = async () => {
        setLoading(true);
        setLog([]);
        setupConsoleCapture();

        try {
            setLog(['Running Firebase integration test...']);
            const result = await testFirebaseConnection();
            setResults({ firebase: result });
        } catch (error) {
            console.error('Firebase test execution error:', error);
        } finally {
            restoreConsole();
            setLoading(false);
        }
    };

    const handleRunStripe = async () => {
        setLoading(true);
        setLog([]);
        setupConsoleCapture();

        try {
            setLog(['Running Stripe integration test...']);
            const result = await testStripeIntegration();
            setResults({ stripe: result });
        } catch (error) {
            console.error('Stripe test execution error:', error);
        } finally {
            restoreConsole();
            setLoading(false);
        }
    };

    const getResultBadge = (result?: boolean) => {
        if (result === undefined) return null;
        return result ?
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">PASSED</span> :
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">FAILED</span>;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Integration Tests</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleRunAll}
                        disabled={loading}
                        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Run All Tests
                    </button>

                    <button
                        onClick={handleRunFirebase}
                        disabled={loading}
                        className={`px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Test Firebase
                    </button>

                    <button
                        onClick={handleRunStripe}
                        disabled={loading}
                        className={`px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Test Stripe
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center mb-6">
                    <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin mr-3"></div>
                    <span>Running tests...</span>
                </div>
            )}

            {(results.firebase !== undefined || results.stripe !== undefined) && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Test Results</h2>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {results.firebase !== undefined && (
                            <div className="mb-4 flex items-center">
                                <div className="font-medium w-32">Firebase:</div>
                                {getResultBadge(results.firebase)}
                            </div>
                        )}

                        {results.stripe !== undefined && (
                            <div className="mb-4 flex items-center">
                                <div className="font-medium w-32">Stripe:</div>
                                {getResultBadge(results.stripe)}
                            </div>
                        )}

                        {results.success !== undefined && (
                            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center">
                                <div className="font-bold w-32">Overall:</div>
                                {getResultBadge(results.success)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-xl font-semibold mb-4">Test Log</h2>
                <div className="bg-gray-900 text-gray-200 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                        {log.length > 0 ? log.join('\n') : 'No logs yet. Run a test to see output.'}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default TestPage; 