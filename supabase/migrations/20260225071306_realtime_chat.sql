drop policy "authenticated_read" on "public"."message";


  create policy "Users can view their own participant records"
  on "public"."conversation_participant"
  as permissive
  for select
  to authenticated
using ((user_id = (auth.jwt() ->> 'sub'::text)));



  create policy "Users can insert messages into their conversations"
  on "public"."message"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.conversation_participant
  WHERE ((conversation_participant.conversation_id = message.conversation_id) AND (conversation_participant.user_id = (auth.uid())::text)))) AND (sender_id = (auth.uid())::text)));



  create policy "Users can view messages in their conversations"
  on "public"."message"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.conversation_participant
  WHERE ((conversation_participant.conversation_id = message.conversation_id) AND (conversation_participant.user_id = ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'sub'::text))))));



  create policy "Allow auth users to use realtime"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (true);



