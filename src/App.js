import { useState } from 'react'
import { AdvancedForm } from './components/forms/AdvancedForm'
import { ChatClient } from '@azure/communication-chat';
import {
    AzureCommunicationTokenCredential,
    parseConnectionString
} from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";

export default function App() {
  const [formValues, setFormValues] = useState([])
  const [checked, setChecked] = useState(false)
  const handleTab = () => { 
    if (checked === 0) {
      setChecked(1)
    } else {
      setChecked(0)
    }
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true)
    setFormValues(values)
    await new Promise((r) => setTimeout(r, 1000))
    switch (values.action) {
      case 'init':
        init(values, checked);
        break;
      case 'sendmsg':
        sendMessage(values.messageType, values.messageContent);
        break;
      case 'loadmsg':
        loadMessage()
        break;
      case 'startnotification':
        startnotification()
        break;
      case 'stopnotification':
        stopnotification();
        break;
      default:
        console.log("error: " + values.actions)
        break;
    }
    setSubmitting(false)
  }

  const init = async(value, checked) => {
    let token = ''
    let endpoint = ''
    console.log(checked);
    console.log(value);
    const chatClient = new ChatClient(endpoint, new AzureCommunicationTokenCredential(token));
    console.log("init called");
  }

  const sendMessage = async(type, content) => {
    console.log(type, content)
    console.log("send message called")
  }

  const loadMessage = async() => {
    console.log("load message called")
  }

  const startnotification = async() => {
    console.log("start")
  }

  const stopnotification = async() => {
    console.log("stop")
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
        { label: 'Join Chat', value: 'init' },
        { label: 'Send Message', value: 'sendmsg', disable: false },
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
              HTTP 200
            </pre>
          </div>
          <p>Response status:</p>
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </div>
      </div>
    </>
  )
}
