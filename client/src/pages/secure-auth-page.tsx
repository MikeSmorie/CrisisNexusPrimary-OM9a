import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Shield, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  skipEmailVerification: z.boolean().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  skipEmailVerification: z.boolean().optional(),
});

export default function SecureAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [bypassActive, setBypassActive] = useState(false);
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [envInfo, setEnvInfo] = useState({ env: "unknown", dbName: "unknown" });
  const { toast } = useToast();
  const { login, register } = useUser();
  const [, setLocation] = useLocation();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      skipEmailVerification: false,
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      skipEmailVerification: false,
    },
  });

  // Check bypass environment on component mount
  useEffect(() => {
    const checkBypassStatus = async () => {
      try {
        const response = await fetch('/api/auth/bypass-status', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setBypassEnabled(data.bypassEnabled);
          setEnvInfo(data.envInfo);
        }
      } catch (error) {
        console.error('Failed to check bypass status:', error);
      }
    };
    checkBypassStatus();
  }, []);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      // Direct API call to handle bypass logic
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          skipEmailVerification: values.skipEmailVerification
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok) {
        if (values.skipEmailVerification && bypassEnabled) {
          setBypassActive(true);
          toast({
            title: "Login successful (Bypass Mode)",
            description: "⚠️ Email verification bypassed — TESTING MODE ONLY",
          });
        } else {
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
        }
        setLocation("/dashboard");
      } else {
        if (result.requiresVerification) {
          toast({
            title: "Email verification required",
            description: "Please verify your email address before logging in.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: result.message,
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        if (values.skipEmailVerification && bypassEnabled) {
          setBypassActive(true);
          toast({
            title: "Registration successful (Bypass Mode)",
            description: "⚠️ Email verification bypassed — TESTING MODE ONLY",
          });
          setLocation("/dashboard");
        } else {
          toast({
            title: "Registration successful",
            description: "Please check your email to verify your account.",
          });
          setActiveTab("login");
        }
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Welcome
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Environment Info for Anti-Counterfeit Check */}
          {bypassEnabled && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Development Environment Detected</strong><br />
                Email verification bypass available for testing purposes.
              </AlertDescription>
            </Alert>
          )}

          {/* Active Bypass Warning */}
          {bypassActive && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                ⚠️ Email verification bypassed — TESTING MODE ONLY
              </AlertDescription>
            </Alert>
          )}

          {/* MANDATORY: Login/Register Toggle Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              {...field}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Verification Bypass Checkbox (Testing Mode Only) */}
                  {bypassEnabled && (
                    <FormField
                      control={loginForm.control}
                      name="skipEmailVerification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-yellow-300 bg-yellow-50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setBypassActive(!!checked);
                              }}
                              className="border-yellow-400 data-[state=checked]:bg-yellow-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium text-yellow-700">
                              Skip email verification (Testing mode)
                            </FormLabel>
                            <p className="text-xs text-yellow-600">
                              ⚠️ Bypass email verification for immediate testing access
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your username" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              {...field}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Verification Bypass Checkbox for Registration */}
                  {bypassEnabled && (
                    <FormField
                      control={registerForm.control}
                      name="skipEmailVerification"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-yellow-300 bg-yellow-50">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setBypassActive(!!checked);
                              }}
                              className="border-yellow-400 data-[state=checked]:bg-yellow-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium text-yellow-700">
                              Skip email verification (Testing mode)
                            </FormLabel>
                            <p className="text-xs text-yellow-600">
                              ⚠️ Bypass email verification for immediate testing access
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          {/* MANDATORY: Navigation Links */}
          <div className="text-center mt-6 space-y-2">
            <Link href="/forgot-password">
              <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground">
                Forgot your password?
              </Button>
            </Link>
            <div>
              <Link href="/verify-email">
                <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground">
                  Need to verify your email?
                </Button>
              </Link>
            </div>
            <div className="pt-2 border-t border-border">
              <Link href="/admin-register">
                <Button variant="outline" size="sm" className="text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Register as Administrator
                </Button>
              </Link>
            </div>
          </div>

          {/* Security Notice */}
          <Alert className="mt-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This authentication system is protected by Omega-9 Security Laws. 
              All login attempts are monitored and logged.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}