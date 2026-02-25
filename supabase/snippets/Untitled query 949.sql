-- 1. Setup the session
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "GEhKt3zT1Q5x2GgGHzhZFAUz05bQUaG3"}';

-- 2. Run the query using the JWT extraction logic
SELECT * FROM message 
WHERE conversation_id = '1b336579-a423-484f-ab1e-9b932c021a71'
AND EXISTS (
    SELECT 1 FROM conversation_participant
    WHERE conversation_participant.conversation_id = message.conversation_id
    AND conversation_participant.user_id = (auth.jwt() ->> 'sub')::text
);