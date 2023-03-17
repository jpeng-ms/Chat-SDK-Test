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
  const [formValues, setFormValues] = useState([])
  const [checked, setChecked] = useState(false)
  const [status, setStatus] = useState('')

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
        await startnotification(values)
        break;
      case 'stopnotification':
        await stopnotification();
        break;
      case 'end':
        await end()
      default:
        console.log("error: " + values.actions)
        break;
    }
  }

  const init = async(value, checked) => {
    setStatus("init started")
    if (checked == 0) {
      let result1 = await _startCall(value)
      setFormValues(result1)
    }
    let result2 = await _startChat(value)
    setFormValues(result2)
  }

  const _startChat = async(value) => {
    setStatus("chat start requested")
    window.chatClient = new ChatClient(value.endpoint, 
      new AzureCommunicationTokenCredential(value.token));
    let thread = await _getThreadID(value.threadid)
    window.chatThreadClient = await window.chatClient.getChatThreadClient(thread);
    setStatus("chat started")
  }

  const end = async() => {
    setStatus("call ended requested")
    let result = await window.call.hangUp();
    setStatus("call ended")
    setFormValues(result)
  }

  const _startCall = async(value) => {
    setStatus("call start requested")
    if (window.callAgent === undefined) {
      await _initCall(value)
    }
    window.call = window.callAgent.join({ meetingLink: value.threadid },{});
    window.call.on('stateChanged', () => {
      setStatus("call state: " +  window.call.state);
    })
  }

  const _initCall = async(value) => {
    console.log("init called")
    const callClient = new CallClient();
    window.callToken = new AzureCommunicationTokenCredential(value.token);
    window.callAgent = await callClient.createCallAgent(window.callToken, { displayName: value.displayName });
  }

  const sendMessage = async(value) => {
    setStatus("send message requested")
    let sendMessageRequest = { content: value.messageContent };
    let sendMessageOptions = { senderDisplayName : value.displayname };
    let sendChatMessageResult = await window.chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
    setStatus("send message done")
    setFormValues(sendChatMessageResult)
  }

  const loadMessage = async() => {
    setStatus("load message requested")
    let array = []
    for await (const message of window.chatThreadClient
      .listMessages({ maxPageSize: 200 })) {
        array.push(message)
    }
    setStatus("load message done")
    setFormValues(array)
  }

  const startnotification = async(value) => {
    setStatus("real time notification requested ");
    setFormValues({})
    let result = await window.chatClient.startRealtimeNotifications();
    setStatus("real time notification started ");
    setFormValues(result)
    window.chatClient.on("chatMessageReceived", (e) => {
      array.push(e)
      setStatus("new event:  chatMessageReceived");
      setFormValues(array)
    })
  }

  const stopnotification = async() => {
    let result = await window.chatClient.stopRealtimeNotifications();
    setStatus("real time notification stopped ");
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

  const formSchema = [

    { name: 'token', label: 'Token', componentType: 'text', required: true },
    { name: 'mri', label: 'User ID', componentType: 'text', required: true },
    { name: 'endpoint', label: 'Endpoint URL', componentType: 'text', required: true },
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
              <input type="radio" className="tab-toggle" name="tab-toggle" id="tab1" onChange={handleTab} checked={checked == 0} />
              <input type="radio" className="tab-toggle" name="tab-toggle" id="tab2" onChange={handleTab} checked={checked == 1} />

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
            <p>Request status:</p>
            <pre>
            <p>{status}</p>
            </pre>
          </div>
          <p>Response status:</p>
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </div>
      </div>
    </>
  )
}
