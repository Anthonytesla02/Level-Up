import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Database, ExternalLink } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected' | 'initializing'>('loading');
  const [message, setMessage] = useState('Checking database connection...');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [isNetlify, setIsNetlify] = useState(false);
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if we're running on Netlify
    setIsNetlify(window.location.hostname.includes('netlify.app') || 
                process.env.NODE_ENV === 'production');
    
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Checking database connection...');
      
      const response = await fetch('/.netlify/functions/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('connected');
        setMessage(data.message);
        setTablesExist(data.tablesExist);
        setIsInitialized(!!data.tablesExist);
      } else {
        setStatus('disconnected');
        setMessage(data.message);
        setTablesExist(false);
        if (data.instructions) {
          setInstructions(data.instructions);
        }
      }
    } catch (error) {
      setStatus('disconnected');
      setMessage('Failed to check database connection. Please make sure your DATABASE_URL is set correctly in Netlify environment variables.');
      setTablesExist(false);
      setInstructions([
        '1. Sign up for a free Neon PostgreSQL account at https://neon.tech',
        '2. Create a new project',
        '3. Get your connection string from the Neon dashboard',
        '4. Add it as DATABASE_URL in your Netlify environment variables',
        '5. Re-deploy your site',
      ]);
    }
  };
  
  const initializeDatabase = async () => {
    try {
      setStatus('initializing');
      setMessage('Creating database tables...');
      
      const response = await fetch('/.netlify/functions/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initialize' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('connected');
        setMessage(data.initialized 
          ? 'Database tables created successfully! Your app is ready to use.' 
          : 'Database tables already exist and are ready to use.');
        setTablesExist(true);
        setIsInitialized(true);
      } else {
        setStatus('disconnected');
        setMessage(`Failed to initialize database: ${data.message}`);
      }
    } catch (error) {
      setStatus('disconnected');
      setMessage('Failed to initialize database. Please check your connection settings.');
    }
  };

  if (!isNetlify) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Local Development Environment</CardTitle>
            <CardDescription>
              This page is only useful in production. You're currently in the development environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The database setup wizard is only needed when running on Netlify.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>Database Setup Wizard</span>
          </CardTitle>
          <CardDescription>
            Configure your PostgreSQL database for your Netlify deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="mb-4">
              <TabsTrigger value="status">Connection Status</TabsTrigger>
              <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status">
              {status === 'loading' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Checking Connection</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              {status === 'initializing' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Initializing Database</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              {status === 'connected' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700">Connected</AlertTitle>
                  <AlertDescription className="text-green-600">{message}</AlertDescription>
                </Alert>
              )}
              
              {status === 'disconnected' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Failed</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4 flex flex-col space-y-2">
                {status === 'connected' && tablesExist === false && (
                  <div className="mb-2">
                    <Alert className="bg-yellow-50 border-yellow-200 mb-3">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertTitle className="text-yellow-700">Tables Not Found</AlertTitle>
                      <AlertDescription className="text-yellow-600">
                        Your database is connected, but no tables exist. Click the button below to create them.
                      </AlertDescription>
                    </Alert>
                    <Button 
                      onClick={initializeDatabase} 
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Initialize Database Tables
                    </Button>
                  </div>
                )}
                
                {status === 'connected' && tablesExist === true && !isInitialized && (
                  <Alert className="bg-green-50 border-green-200 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Ready to Use</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Your database is connected and tables are ready.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button onClick={checkDatabaseConnection}>
                  Check Connection Again
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="setup">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Setting up your database</h3>
                
                <p>Follow these steps to connect your application to a PostgreSQL database:</p>
                
                <div className="pl-4 space-y-2">
                  {instructions.map((instruction, index) => (
                    <p key={index}>{instruction}</p>
                  ))}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Recommended Database Providers:</h4>
                  <ul className="space-y-2">
                    <li>
                      <a
                        href="https://neon.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Neon <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-gray-600">Serverless PostgreSQL with generous free tier</p>
                    </li>
                    <li>
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Supabase <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-gray-600">PostgreSQL with additional features like Auth, Storage, and more</p>
                    </li>
                    <li>
                      <a
                        href="https://railway.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Railway <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-gray-600">Easy deployment platform with PostgreSQL database</p>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
          
          {(status === 'connected' && tablesExist) ? (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = '/'}
            >
              Start Using App
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => window.open('https://neon.tech', '_blank')}
            >
              Get a Neon Database
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}