"use client";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "./actions";

export function DeleteAccountButton() {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive"> Delete account </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle> Delete your account </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete your account and all your projects, profile data, and uploaded avatars. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel> Cancel </AlertDialogCancel>
                    <form action={deleteAccount}>
                        <Button type="submit" variant="destructive">
                            Delete account
                        </Button>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}