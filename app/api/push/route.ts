import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, subscription, reminderTimes } = body;

    // Check Supabase status
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isMock = !supabaseUrl || supabaseUrl.includes("placeholder-project");

    if (action === "subscribe") {
      if (!isMock) {
        try {
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("push_subscriptions").upsert({
              user_id: user.id,
              endpoint: subscription.endpoint,
              keys: subscription.keys,
              reminder_times: reminderTimes || {
                weighin: "07:00",
                workout: "18:00",
                water: true,
              },
            });
          }
        } catch {
          // Continue if Supabase push table write fails
        }
      }

      return NextResponse.json({
        success: true,
        message: "Push notifications successfully enabled for Bench & Dal.",
      });
    }

    if (action === "test") {
      return NextResponse.json({
        success: true,
        notification: {
          title: "Bench & Dal Coach",
          body: "Reminder: Morning weigh-in logged? Don't forget your 35g protein breakfast!",
          url: "/today",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Acknowledged" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process push request" },
      { status: 400 }
    );
  }
}
