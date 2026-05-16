import type { Metadata } from 'next';
import { getProfile } from './queries';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { ProfileInfoForm } from './profile-info-form';
import { EmailForm } from './email-form';
import { createClient } from '@/lib/supabase/server';
import { PasswordForm } from './password-form';
import { DeleteAccountButton } from './delete-account-button';

export const metadata: Metadata = {
    title: "Profile"
};

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const email = (claimsData?.claims.email as string | undefined) ?? "";
    const provider = (claimsData?.claims.app_metadata?.provider as string | undefined) ?? "email";
    const isOAuthUser = provider !== "email";

    const profile = await getProfile();
    if (!profile) {
        redirect("/login");
    }
    
    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold"> Profile </h1>

            <Card>
                <CardHeader>
                    <CardTitle> Profile Info </CardTitle>
                    <CardDescription> Your display name and avatar. </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense>
                        <ProfileInfoForm profile={profile}/>
                    </Suspense>
                </CardContent>
            </Card>
            
            {!isOAuthUser ? (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle> Email </CardTitle>
                        <CardDescription> Change the email address for your account. </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense>
                            <EmailForm currentEmail={email}/>
                        </Suspense>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle> Password </CardTitle>
                        <CardDescription> Update the password used to log in. </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense>
                            <PasswordForm />
                        </Suspense>
                    </CardContent>
                </Card>
                </>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Sign-in method</CardTitle>
                        <CardDescription>
                            You signed in using {provider.charAt(0).toUpperCase() + provider.slice(1)}.
                            Manage your email and password through your{" "} {provider.charAt(0).toUpperCase() + provider.slice(1)} account settings.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle> Danger zone </CardTitle>
                    <CardDescription>
                        Permanent account actions. Deletion cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DeleteAccountButton />
                </CardContent>
            </Card>
        </main>
    )
}