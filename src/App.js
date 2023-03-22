import { useState } from 'react'
import { AdvancedForm } from './components/forms/AdvancedForm'
import { CallClient } from "@azure/communication-calling";
import { ChatClient } from '@azure/communication-chat';
import {
    AzureCommunicationTokenCredential,
    parseConnectionString
} from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { array } from 'yup';

export default function App() {
  const [formValues, setFormValues] = useState('')
  const [checked, setChecked] = useState(0)
  const [status, setStatus] = useState('')
  const [mri, setMRI] = useState('')

  const handleTab = () => { 
    if (checked === 0) {
      setChecked(1)
    } else {
      setChecked(0)
    }
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true)
    // setFormValues(values)
    await new Promise((r) => setTimeout(r, 1000))
    switch (values.action) {
      case 'init':
        await init(values, checked);
        break;
      case 'sendmsg':
        await sendMessage(values);
        break;
      case 'loadmsg':
        await loadMessage()
        break;
      case 'startnotification':
        await startnotification()
        break;
      case 'stopnotification':
        await stopnotification();
        break;
      case 'end':
        await end()
        break;
      case 'eventControl':
        await eventControl(values)
        break;
      default:
        console.log("error: " + values.actions)
        break;
    }
  }

  const init = async(value, checked) => {
    setStatus("init started")
    try {
      let token = await _getToken(value);
      if (checked === 0) {
        let result1 = await _startCall(value, token)
        setFormValues(result1)
      }
      let result2 = await _startChat(value, token)
      setFormValues(result2)
    } catch (err) {
      setStatus("init failed")
      setFormValues(err)
    }
  }

  const _getToken = async(value) => {
    const identityClient = new CommunicationIdentityClient(value.connectionString);
    const user = await identityClient.createUser();
    setStatus("user created");
    const token = await identityClient.getToken(user, ["voip", "chat"]);
    setStatus("token created");
    value.token = token;
    setMRI("MRI: " + user.communicationUserId)
    return token
}

  const _startChat = async(value, token) => {
    setStatus("chat start requested")
    window.chatClient = new ChatClient(await _getEndpointURL(value.connectionString), 
      new AzureCommunicationTokenCredential(token));
    let thread = await _getThreadID(value.threadid)
    window.chatThreadClient = await window.chatClient.getChatThreadClient(thread);
    setStatus("chat started")
  }

  const end = async() => {
    try {
      setStatus("call ended requested")
      let result = await window.call.hangUp();
      setStatus("call ended")
      setFormValues(result)
    } catch (err) {
      setStatus("end call failed")
      setFormValues(err)
    }
  }

  const _startCall = async(value, token) => {
    setStatus("call start requested")
    if (window.callAgent === undefined) {
      await _initCall(value, token)
    }
    window.call = window.callAgent.join({ meetingLink: value.threadid },{});
    window.call.on('stateChanged', () => {
      setStatus("call state: " +  window.call.state);
    })
  }

  const _initCall = async(value, token) => {
    console.log("init called")
    const callClient = new CallClient();
    window.callToken = new AzureCommunicationTokenCredential(token);
    window.callAgent = await callClient.createCallAgent(window.callToken, { displayName: value.displayName });
  }

  const sendMessage = async(value) => {
    setStatus("send message requested")
    setFormValues('')
    let sendMessageRequest = { content: value.messageContent };
    let sendMessageOptions = { senderDisplayName : value.displayname, type: value.messageType};
    try {
      let sendChatMessageResult = await window.chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
      setStatus("send message done")
      setFormValues(sendChatMessageResult)
    } catch (err) {
      setStatus("send message failed")
      setFormValues(err)
    }
  }

  const loadMessage = async() => {
    setStatus("load message requested")
    let array = []
    try {
      for await (const message of window.chatThreadClient
        .listMessages({ maxPageSize: 200 })) {
          array.push(message)
      }
      setStatus("load message done")
      setFormValues(array)
    } catch (err) {
      setStatus("load message failed")
      setFormValues(err)
    }
  }

  const startnotification = async() => {
    try {
      setStatus("real time notification requested ");
      setFormValues('')
      let result = await window.chatClient.startRealtimeNotifications();
      setStatus("real time notification started, go to event control to subscribe events");
      setFormValues(result)
    } catch (err) {
      setStatus("start failed")
      setFormValues(err)
    }
  }

  const stopnotification = async() => {
    try {
      let result = await window.chatClient.stopRealtimeNotifications();
      setStatus("real time notification stopped ");
      setFormValues(result)
    } catch (err) {
      setStatus("stop failed")
      setFormValues(err)
    }
  }

  const eventControl = async(value) => {
    try {
      if (value.eventAction === 'on') {
        await _on(value);
      } else {
        await _off(value);
      }
    } catch(err) {
      setStatus("action failed for : " + value.eventType);
      setFormValues(err)
    }
  }

  const _on = async(value) => {
    setStatus("turning on event: " + value.eventType);
    let result = await window.chatClient.on(value.eventType, (e) => {
      setStatus("new event: " + value.eventType);
      setFormValues(e)
    })
    setFormValues(result)
  }

  const _off = async(value) => {
    setStatus("turning off event: " + value.eventType);
    let result = await window.chatClient.off(value.eventType, (e) => {
      setStatus("new event: " + value.eventType);
      setFormValues(e)
    })
    setFormValues(result)
  }

  const _getThreadID = async(val) => {
    if(/(http(s?)):\/\//i.test(val)) {
      var base = val.split("/meetup-join/")[1]
      var thread = base.split("thread.v2/")[0]
      thread += "thread.v2"
      return decodeURIComponent(thread)
    }
    return val
  }

  const _getEndpointURL = async(val) => {
      let str = val.replace("endpoint=", "")
      return str.split("/;accesskey=")[0]
  }
  const formSchema = [
    { name: 'connectionString', label: 'Connection String', componentType: 'text', required: true },
    { name: 'threadid', label: 'Thread ID or Meeting URL', componentType: 'text', required: true },
    { name: 'displayname', label: 'Display Name', componentType: 'text', required: true },
    {
      name: 'action',
      label: 'Actions',
      componentType: 'radioGroup',
      options: [
        { label: 'Join Chat/Call', value: 'init' },
        { label: 'Leave Chat/Call', value: 'end' },
        { label: 'Send Message', value: 'sendmsg' },
        { label: 'Load Past Messages', value: 'loadmsg' },
        { label: 'Start notification', value: 'startnotification' },
        { label: 'Stop notification', value: 'stopnotification' },
        { label: 'Event Control', value: 'eventControl' }
      ],
    },
    {
      name: 'messageContent', label: 'Message Content', componentType: 'textarea',
      condition: { key: 'action', value: 'sendmsg', operator: '=' }
    },
    {
      name: 'messageType',
      label: 'Message Type',
      componentType: 'select',
      options: [
        { label: 'Html', value: 'html' },
        { label: 'Text', value: 'text' },
        { label: 'Topic Update', value: 'topicUpdated' },
        { label: 'Participant Added', value: 'participantAdded' },
        { label: 'Participant Removed', value: 'participantRemoved' }
      ],
      condition: { key: 'action', value: 'sendmsg', operator: '=' }
    },
    {
      name: 'eventAction',
      label: 'Event Action',
      componentType: 'radioGroup',
      options: [
        { label: 'Subscribe', value: 'on' },
        { label: 'Unsubscribe', value: 'off' }
      ],
      condition: { key: 'action', value: 'eventControl', operator: '=' },
    },
    {
      name: 'eventType',
      label: 'Event Type',
      componentType: 'select',
      options: [
        { label: 'chatMessageReceived', value: 'chatMessageReceived' },
        { label: 'chatMessageEdited', value: 'chatMessageEdited' },
        { label: 'chatMessageDeleted', value: 'chatMessageDeleted' },
        { label: 'typingIndicatorReceived', value: 'typingIndicatorReceived' },
        { label: 'readReceiptReceived', value: 'readReceiptReceived' },
        { label: 'chatThreadCreated', value: 'chatThreadCreated' },
        { label: 'chatThreadPropertiesUpdated', value: 'chatThreadPropertiesUpdated' },
        { label: 'chatThreadDeleted', value: 'chatThreadDeleted' },
        { label: 'participantsAdded', value: 'participantsAdded' },
        { label: 'participantsRemoved', value: 'participantsRemoved' }
      ],
      condition: { key: 'action', value: 'eventControl', operator: '=' },
    }
  ]

  const formSchema2 = [
    { name: 'connectionstring', label: 'Connection String', componentType: 'text', required: true },
    {
      name: 'action',
      label: 'Actions',
      componentType: 'radioGroup',
      options: [
        { label: 'Join Chat', value: 'init' },
        { label: 'Leave Chat', value: 'end' },
        { label: 'Send Message', value: 'sendmsg' },
        { label: 'Load Past Messages', value: 'loadmsg' },
        { label: 'Start notification', value: 'startnotification' },
        { label: 'Stop notification', value: 'stopnotification' },
      ],
    },
    {
      name: 'messageContent', label: 'Message Content', componentType: 'textarea',
      condition: { key: 'action', value: 'sendmsg', operator: '=' },
    },
    {
      name: 'messageType',
      label: 'Message Type',
      componentType: 'select',
      options: [
        { label: 'RichText/HTML', value: 'html' },
        { label: 'Text', value: 'text' },
      ],
      condition: { key: 'action', value: 'sendmsg', operator: '=' },
    }
  ]

  return (
    <>
      <h1>Chat SDK Test</h1>

      <div className="flex">
        <div className="form section">
        <div className="container">
            <div className="box">
              <input type="radio" className="tab-toggle" name="tab-toggle" id="tab1" onChange={handleTab} checked={checked === 0} />
              <input type="radio" className="tab-toggle" name="tab-toggle" id="tab2" onChange={handleTab} checked={checked === 1} />

              <ul className="tab-list">
                <li className="tab-item">
                  <label className="tab-trigger" htmlFor="tab1">Existing Thread</label>
                </li>
                <li className="tab-item">
                  <label className="tab-trigger" htmlFor="tab2">New Thread</label>
                </li>
              </ul>
              
              <div className="tab-container">
                <div className="tab-content">
                  <AdvancedForm schema={formSchema} onSubmit={handleSubmit} />
                </div>
                <div className="tab-content">
                  <AdvancedForm schema={formSchema2} onSubmit={handleSubmit} />
                </div>
              </div>
            </div>
          </div>

        </div>
        <div className="results section">
          <div>
            <p>{ mri }</p>
            <p>Request status:</p>
            <pre>
            <p>{ status }</p>
            </pre>
          </div>
          <p>Response status:</p>
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </div>
      </div>
    </>
  )
}
