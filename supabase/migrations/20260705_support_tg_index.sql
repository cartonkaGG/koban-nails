create index if not exists support_messages_tg_msg_idx
  on public.support_messages (telegram_message_id)
  where telegram_message_id is not null;
