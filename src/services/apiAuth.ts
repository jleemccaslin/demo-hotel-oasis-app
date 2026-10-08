import { AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import supabase, { supabaseUrl } from "./supabase";

//============ ERRORS ==============
const NETWORK_ERROR_MESSAGE =
  "Couldn't reach server. Check your internet connection. If you use a script blocker or privacy extension, allow supabase.co on this site and try again.";

function authErrorMessage(error: AuthError) {
  // Status 0 means the request never got a response: the user is offline, or a browser extension blocked the request to Supabase
  if (isAuthRetryableFetchError(error) && error.status === 0)
    return NETWORK_ERROR_MESSAGE;

  return error.message;
}

//============ TYPES ==============
interface SignupOptions {
  fullName: string;
  email: string;
  password: string;
}

interface LoginOptions {
  email: string;
  password: string;
}

interface UpdateCurrentUserOptions {
  password?: string;
  fullName?: string;
  avatar?: File | null;
}

//============ API FUNCTIONS ==============
export async function signup({ fullName, email, password }: SignupOptions) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullName,
        avatar: "",
      },
    },
  });

  if (error) throw new Error(error.message);

  return data;
}

export async function login({ email, password }: LoginOptions) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(authErrorMessage(error));

  return data;
}

export async function loginDemo() {
  // The demo credentials live in a Netlify Function, not in the client bundle
  let res: Response;
  try {
    res = await fetch("/.netlify/functions/demo-login", { method: "POST" });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  const tokens = await res.json().catch(() => ({}));

  if (!res.ok || !tokens.access_token)
    throw new Error(tokens.error ?? "Demo login failed");

  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  if (error) throw new Error(authErrorMessage(error));

  return data;
}

export async function getCurrentUser() {
  const { data: session, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw new Error("Login error", { cause: sessionError });

  if (!session?.session) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw new Error(authErrorMessage(userError));

  return user;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function updateCurrentUser({
  password,
  fullName,
  avatar,
}: UpdateCurrentUserOptions) {
  // 1. Update password OR fullName
  let updateData: { password?: string; data?: { fullName?: string } } = {};
  if (password) updateData = { password };
  if (fullName) updateData = { data: { fullName } };

  const { data, error } = await supabase.auth.updateUser(updateData);

  if (error) throw new Error(error.message);
  if (!avatar) return data;

  // 2. Upload avatar image
  const fileName = `avatar-${data.user.id}-${Math.random()}`;

  const { error: storageError } = await supabase.storage
    .from("avatars")
    .upload(fileName, avatar);

  if (storageError) throw new Error(storageError.message);

  // 3. Update avatar in the user
  const { data: updatedUser, error: updateError } =
    await supabase.auth.updateUser({
      data: {
        avatar: `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`,
      },
    });

  if (updateError) throw new Error(updateError.message);

  return updatedUser;
}
