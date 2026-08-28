import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Group, GroupMember, GroupMessage, MessageReport

class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'group_chat_{self.group_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Notify presence
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'group_id': self.group_id,
                'status': 'online_heartbeat'
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action', 'send_message')

            if action == 'send_message':
                content = data.get('content', '').strip()
                sender_id = data.get('sender_id')
                sender_name = data.get('sender_name', 'Devotee')
                sender_role = data.get('sender_role', 'pilgrim')
                message_type = data.get('message_type', 'TEXT')

                if content:
                    msg = await self.save_message(
                        group_id=self.group_id,
                        sender_id=sender_id,
                        sender_name=sender_name,
                        sender_role=sender_role,
                        message_type=message_type,
                        content=content
                    )

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message_broadcast',
                            'message': msg
                        }
                    )

            elif action == 'send_announcement':
                content = data.get('content', '').strip()
                sender_id = data.get('sender_id')
                sender_name = data.get('sender_name', 'Admin')

                if content:
                    msg = await self.save_message(
                        group_id=self.group_id,
                        sender_id=sender_id,
                        sender_name=sender_name,
                        sender_role='admin',
                        message_type='ANNOUNCEMENT',
                        content=content
                    )

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message_broadcast',
                            'message': msg
                        }
                    )

            elif action == 'pin_message':
                message_id = data.get('message_id')
                is_pinned = data.get('is_pinned', True)
                success = await self.toggle_pin_message(message_id, is_pinned)
                if success:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'message_pin_update',
                            'message_id': message_id,
                            'is_pinned': is_pinned
                        }
                    )

            elif action == 'delete_message':
                message_id = data.get('message_id')
                success = await self.delete_message_record(message_id)
                if success:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'message_deleted_broadcast',
                            'message_id': message_id
                        }
                    )

            elif action == 'typing':
                user_name = data.get('user_name', 'Someone')
                is_typing = data.get('is_typing', True)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_status_broadcast',
                        'user_name': user_name,
                        'is_typing': is_typing
                    }
                )

            elif action == 'mark_read':
                user_id = data.get('user_id')
                if user_id:
                    await self.update_last_read(self.group_id, user_id)

        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    # Handlers for messages broadcasted from group_send
    async def chat_message_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def message_pin_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'pin_update',
            'message_id': event['message_id'],
            'is_pinned': event['is_pinned']
        }))

    async def message_deleted_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id']
        }))

    async def typing_status_broadcast(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_name': event['user_name'],
            'is_typing': event['is_typing']
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'group_id': event['group_id'],
            'status': event['status']
        }))

    # Database sync helpers
    @database_sync_to_async
    def save_message(self, group_id, sender_id, sender_name, sender_role, message_type, content):
        group = Group.objects.get(id=group_id)
        sender = User.objects.filter(id=sender_id).first() if sender_id else None
        
        # If sender_name not provided or generic, get from user
        if sender and (not sender_name or sender_name == 'Devotee'):
            sender_name = sender.get_full_name() or sender.username

        msg = GroupMessage.objects.create(
            group=group,
            sender=sender,
            sender_name=sender_name,
            sender_role=sender_role,
            message_type=message_type,
            content=content
        )
        return {
            'id': msg.id,
            'group': group.id,
            'sender': sender.id if sender else None,
            'sender_name': msg.sender_name,
            'sender_role': msg.sender_role,
            'message_type': msg.message_type,
            'content': msg.content,
            'is_pinned': msg.is_pinned,
            'is_deleted': msg.is_deleted,
            'created_at': msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def toggle_pin_message(self, message_id, is_pinned):
        try:
            msg = GroupMessage.objects.get(id=message_id)
            msg.is_pinned = is_pinned
            msg.save()
            return True
        except GroupMessage.DoesNotExist:
            return False

    @database_sync_to_async
    def delete_message_record(self, message_id):
        try:
            msg = GroupMessage.objects.get(id=message_id)
            msg.is_deleted = True
            msg.save()
            return True
        except GroupMessage.DoesNotExist:
            return False

    @database_sync_to_async
    def update_last_read(self, group_id, user_id):
        GroupMember.objects.filter(group_id=group_id, user_id=user_id).update(last_read_at=timezone.now())
