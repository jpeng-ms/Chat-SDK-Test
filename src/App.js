import { useState } from 'react';
import ReactDOM from 'react-dom';
import { AdvancedForm } from './components/forms/AdvancedForm'
import { CallClient } from "@azure/communication-calling";
import { ChatClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import Highlight from 'react-highlight'

export default function App() {
  const [formValues, setFormValues] = useState('')
  const [checked, setChecked] = useState(0)
  const [status, setStatus] = useState('')
  const [mri, setMRI] = useState('')
  const [threadInfo, setThreadInfo] = useState('')
  const [tokenString, setTokenString] = useState('')
  const [lastMessageContent, setLastMessageContent] = useState('')
  const [lastMessageContentAttachments, setLastMessageContentAttachments] = useState('')
  
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
      case 'sendtyping':
        await sendtyping(values);
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
      case 'addParticipant':
        await addParticipant(values)
        break;
      case 'removeParticipant':
        await removeParticipant(values);
        break;
      case 'getChatThreadProperties':
        await getChatThreadProperties();
        break;
      case 'renderLastMessage':
        await renderLastMessage(values);
        break;
      default:
        console.log("error: " + values.actions)
        break;
    }
  }

  const init = async(value, checked) => {
    document.getElementById('sdk-container').style.display = 'block';
    document.getElementById('blank-container').style.display = 'none';
    setStatus("init started")
    try {
      let token = await _getToken(value);
      if (checked === 0 && value.threadid.indexOf("meetup-join") !== -1) {
        let result1 = await _startCall(value, token)
        setFormValues(result1)
      }
      let result2 = await _startChat(value, token)
      setFormValues(result2)
    } catch (err) {
      setStatus("init failed - CORS error means server is down")
      setFormValues(err)
    }
  }

  const _setupUI = async() => {
    document.getElementById('full-scale-image').addEventListener('click', () => {
      document.getElementById('overlay-container').style.display = 'none';
    });
  }

  const _getToken = async(value) => {
    if (value.token) {
      return value.token
    }
    const identityClient = new CommunicationIdentityClient(value.connectionString);
    const user = await identityClient.createUser();
    setStatus("user created");
    const token = await identityClient.getToken(user, ["voip", "chat"]);
    setStatus("token created");
    value.token = token;
    setTokenString(token);
    setMRI(user.communicationUserId)
    return token
}

const policy = {
  name: 'policy',
  async sendRequest(request, next) {
    const response = await next(request);
    console.log(response);
    window.document.getElementById("http-response").innerHTML = JSON.stringify(response, null, 2);
    // setHttpValues(response);
    return response;
  }
};

  const _startChat = async(value, token) => {
    setStatus("chat start requested")
    let endpointUrl = value.endpointUrl ?? await _getEndpointURL(value.connectionString);
    window.chatClient = new ChatClient(
      endpointUrl,
      new AzureCommunicationTokenCredential(token),
      {
        additionalPolicies: [
          {
            policy: policy,
            position: 'perCall'
          }
        ]
      });
    let thread
    if (checked === 1) {
      const createChatThreadResult = await window.chatClient.createChatThread({ topic: "Welcome to ACS Chat" });
      thread = createChatThreadResult.chatThread ? createChatThreadResult.chatThread.id : "";
      setThreadInfo(thread);
    } else {
      thread = await _getThreadID(value.threadid)
    }
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
    window.callAgent = await callClient.createCallAgent(window.callToken, { displayName: value.displayname });
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

  const getChatThreadProperties = async () => {
    setStatus("get chat thread properties requested")
    try {
      let getChatThreadPropertiesResult = await window.chatThreadClient.getProperties();
      setStatus("get chat thread properties done")
      setFormValues(getChatThreadPropertiesResult)
    } catch (err) {
      setStatus("get chat thread properties failed")
      setFormValues(err)
    }
  }

  const sendtyping = async(value) => {
    setStatus("send typing event requested")
    try {
      let sendTypingNotificationOptions = { senderDisplayName : value.displayname};
      let sendChatMessageResult = await window.chatThreadClient.sendTypingNotification(sendTypingNotificationOptions);
      setStatus("send typing event done")
      setFormValues(sendChatMessageResult)
    } catch (err) {
      setStatus("ssend typing evente failed")
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

  const addParticipant = async(value) => {
    try {
      setStatus("add participant requested")
      const id = (value["add-userMRI-userType"] === 'acs') ? 
      { communicationUserId: value["add-userMRI-id"] } : {microsoftTeamsUserId: value["add-userMRI-id"]}
      const addParticipantsRequest =
      {
        participants: [
          {
            id: id,
            displayName: value["add-userMRI-displayName"]
          }
        ]
      };
      let result = await window.chatThreadClient.addParticipants(addParticipantsRequest);
      setFormValues(result)
    } catch (err) {
      setStatus("failed to add participant")
      setFormValues(err)
    }
  }

  const renderLastMessage = async(value) => {
    document.getElementById('message-content').innerHTML = lastMessageContent;
    document.getElementById('message-content').style.display = 'block';
    if (lastMessageContentAttachments.length === 0) {
      return;
    }
    setStatus("render preview images requested")
    setFormValues('');
    _setupUI();
    renderImageAttachment(lastMessageContentAttachments);
    renderFileAttachment();
    try {
      setFormValues('');
      document.getElementById('message-content').innerHTML = lastMessageContent;
      document.getElementById('message-content').style.display = 'block';
      setImgHandler(document.getElementById('message-content'), lastMessageContentAttachments);
      await fetchPreviewImages(lastMessageContentAttachments, tokenString.token);
    } catch (err) {
      setStatus("render preview images failed")
      setFormValues(err)
    }
  }

  const renderFileAttachment = async(recievedEvent) => {
    var re = /(?:\.([^.]+))?$/;
    const renderedOutput = lastMessageContentAttachments
    .filter(attachment => attachment.attachmentType === "file")
    .map(attachment => 
      <div className="attachment-container" key={attachment.id}>
        <p className="attachment-type">{re.exec(attachment.name)[1]}</p>
				<img className="attachment-icon" alt="attachment file icon"/>
				<div>
					<p>{attachment.name}</p>
          <a href={attachment.previewUrl} target="_blank" rel="noreferrer">Open</a>
          <a href={attachment.url} target="_blank" rel="noreferrer">Download</a>
				</div>
			</div>
    )
    ReactDOM.render(renderedOutput, document.querySelector('#file-attachment'));
  }

  const renderImageAttachment = () => {
    const renderedOutput = lastMessageContentAttachments
    .filter(attachment => attachment.attachmentType === "image" && !lastMessageContent.includes(attachment.id))
    .map(attachment => 
      <img 
      alt="imageattachments" 
      src=""
      key={attachment.id}
      className='image-attachment'
      id={attachment.id}></img>
    )
    ReactDOM.render(renderedOutput, document.querySelector('#image-attachment'));
    setImgHandler(document.getElementById('image-attachment'), lastMessageContentAttachments);
  }

  async function fetchPreviewImages(attachments) {
    if (!attachments.map(attachment => attachment.attachmentType === "image" || 
    attachment.attachmentType === "image").length > 0) {
      return;
    }
    // since each message could contain more than one inline image
    // we need to fetch them individually 
    const result = await Promise.all(
        attachments.filter(attachment => attachment.attachmentType === "image")
        .map(async (attachment) => {
          // fetch preview image from its 'previewURL'
          const response = await fetch(attachment.previewUrl, {
            method: 'GET',
            headers: {
              // the token here should the same one from chat initialization
              'Authorization': 'Bearer ' + tokenString.token,
            },
          });
          // the response would be in image blob we can render it directly
          return {
            id: attachment.id,
            content: await response.blob(),
          };
        }),
    );
    result.forEach((imageResult) => {
      const urlCreator = window.URL || window.webkitURL;
      const url = urlCreator.createObjectURL(imageResult.content);
      // look up the image ID and replace its 'src' with object URL
      document.getElementById(imageResult.id).src = url;
    });
  }


  const removeParticipant = async(value) => {
    setStatus("remove participant requested")
    setFormValues('');
    try {
      const communicationIdentifier = (value["remove-userMRI-id"].indexOf('acs') > 0 ) ? 
      { communicationUserId: value["remove-userMRI-id"] } : {microsoftTeamsUserId: value["remove-userMRI-id"]}
      let result = await window.chatThreadClient.removeParticipant(communicationIdentifier);
      setStatus("remove participant done")
      setFormValues(result)
    } catch (err) {
      setStatus("failed to remove participant")
      setFormValues(err)
    }
  }

  const _on = async(value) => {
    setStatus("turning on event: " + value.eventType);
    let result = await window.chatClient.on(value.eventType, (e) => {
      setStatus("new event: " + value.eventType);
      console.log(e);
      setFormValues(e);
      setLastMessageContent(e.message);
      if (e.attachments.length > 0) {
        setLastMessageContentAttachments(e.attachments);
      }
    });
    setFormValues(result)
  }

  function setImgHandler(element, imageAttachments) {
    // do nothing if there's no image attachments
    if (!imageAttachments.length > 0) {
      return;
    }
    const imgs = element.getElementsByTagName('img');
    for (const img of imgs) {
      img.addEventListener('click', (e) => {
        // fetch full scale image upon click
        fetchFullScaleImage(e, imageAttachments);
      });
    }
  }

  function fetchFullScaleImage(e, imageAttachments) {
    // get the image ID from the clicked image element
    const link = imageAttachments.filter((attachment) =>
      attachment.id === e.target.id)[0].url;
    
    document.getElementById('full-scale-image').src = '';
    
    // fetch the image
    fetch(walkaround(link), {
      method: 'GET',
      headers: {'Authorization': 'Bearer ' + tokenString.token},
    }).then(async (result) => {
    
      // now we set image blob to our overlay element
      const content = await result.blob();
      const urlCreator = window.URL || window.webkitURL;
      const url = urlCreator.createObjectURL(content);
      document.getElementById('full-scale-image').src = url;
    });
    // show overlay
    document.getElementById('overlay-container').style.display = 'block';
  }

  function walkaround(url) {
    return url.replace('threads//', 'threads/123/');
    // return string1.replace('https://global.chat.prod.communication.microsoft.com', _getEndpointURL(connectionString));
  }

  async function copyToClipboard(content) {
    await navigator.clipboard.writeText(content);
  }

  function toggleHttpContainer() {
    let status = document.getElementById('http-response-container').style.display;
    document.getElementById('http-response-container').style.display = (status === 'block') ? 'none' : 'block';
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
    {
      name: 'authentication',
      label: '1. Authentication',
      componentType: 'radioGroup',
      defaultValue: 'viaConnectionString',
      options: [
        { label: 'via Connection String', value: 'viaConnectionString'},
        { label: 'via Token', value: 'viaToken' }
      ],
    },
    {
      name: 'connectionString', label: 'Connection String', componentType: 'text',
      condition: { key: 'authentication', value: 'viaConnectionString', operator: '=' }
    },
    { name: 'token', label: 'Token', componentType: 'text', condition: { key: 'authentication', value: 'viaToken', operator: '=' } },
    { name: 'communicationUserId', label: 'User ID (MRI)', componentType: 'text', condition: { key: 'authentication', value: 'viaToken', operator: '=' } },
    { name: 'endpointUrl', label: 'Endpoint URL', componentType: 'text', condition: { key: 'authentication', value: 'viaToken', operator: '=' } },
    { name: 'threadid', label: '2. Thread ID or Meeting URL', componentType: 'text'},
    { name: 'displayname', label: '3. Display Name', componentType: 'text' },
    {
      name: 'action',
      label: '4. Actions',
      componentType: 'radioGroup',
      options: [
        { label: 'Join Chat/Call', value: 'init' },
        { label: 'Leave Chat/Call', value: 'end' },
        { label: 'Send Message', value: 'sendmsg' },
        { label: 'Send Typing Event', value: 'sendtyping' },
        { label: 'Load Past Messages', value: 'loadmsg' },
        { label: 'Start notification', value: 'startnotification' },
        { label: 'Stop notification', value: 'stopnotification' },
        { label: 'Event Control', value: 'eventControl' },
        { label: 'Render Last Message', value: 'renderLastMessage' },
        { label: 'Get Chat Thread Properties', value: 'getChatThreadProperties' },
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
    {
      name: 'authentication',
      label: '1. Authentication',
      componentType: 'radioGroup',
      defaultValue: 'viaConnectionString',
      options: [
        { label: 'via Connection String', value: 'viaConnectionString'},
        { label: 'via Token', value: 'viaToken'}
      ],
    },
    {
      name: 'connectionString', label: 'Connection String', componentType: 'text',
      condition: { key: 'authentication', value: 'viaConnectionString', operator: '=' }
    },
    { name: 'token', label: 'Token', componentType: 'text', condition: { key: 'authentication', value: 'viaToken', operator: '=' } },
    { name: 'communicationUserId', label: 'User ID (MRI)', componentType: 'text', condition: { key: 'authentication', value: 'viaToken', operator: '=' } },
    { name: 'endpointUrl', label: 'Endpoint URL', componentType: 'text', condition: { key: 'authentication', value: 'viaToken', operator: '=' } },
    { name: 'displayname', label: '2. Display Name', componentType: 'text'},
    {
      name: 'action',
      label: '3. Actions',
      componentType: 'radioGroup',
      options: [
        { label: 'Create Chat', value: 'init' },
        { label: 'Send Message', value: 'sendmsg' },
        { label: 'Send Typing Event', value: 'sendtyping' },
        { label: 'Load Past Messages', value: 'loadmsg' },
        { label: 'Start notification', value: 'startnotification' },
        { label: 'Stop notification', value: 'stopnotification' },
        { label: 'Event Control', value: 'eventControl' },
        { label: 'Add an user', value: 'addParticipant' },
        { label: 'Remove an user', value: 'removeParticipant' },
        { label: 'Render Last Message', value: 'renderLastMessage' },
        { label: 'Get Chat Thread Properties', value: 'getChatThreadProperties' },
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
    },
    {
      name: 'add-userMRI-id', label: 'User MRI', componentType: 'text',
      condition: { key: 'action', value: 'addParticipant', operator: '=' }
    },
    {
      name: 'remove-userMRI-id', label: 'User MRI', componentType: 'text',
      condition: { key: 'action', value: 'removeParticipant', operator: '=' }
    },
    {
      name: 'add-userMRI-displayName', label: 'User Display Name', componentType: 'text',
      condition: { key: 'action', value: 'addParticipant', operator: '=' }
    },
    {
      name: 'add-userMRI-userType',
      label: 'User Type',
      componentType: 'select',
      options: [
        { label: 'Teams User', value: 'teams' },
        { label: 'ACS', value: 'acs' }
      ],
      condition: { key: 'action', value: 'addParticipant', operator: '=' }
    },
  ]

  return (
    <>
      <div className="overlay" id="overlay-container">
        <div className="content">
            <img id="full-scale-image" src="" alt="" />
        </div>
      </div>
      <div className="flex">
        <div className="form section">
        <div className="container">
            <h1><i className="fa-regular fa-message"></i>  Chat SDK Tool</h1>
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
        <div className="results section advanced-form" id='sdk-container'>
          <div className='advanced-form'>
            <div className='container-copy'>
              <div className="copy-text">
                <input type="text" className="text" value={tokenString.token ?? 'N/A'} disabled />
                <button onClick={() => copyToClipboard(tokenString.token)}><i className="fa fa-clone" ></i></button>
              </div>
              <button onClick={toggleHttpContainer} className='container-btn'>Traffic</button>
            </div>
            <br/>
            <div className="copy-text">
                <input type="text" className="text" value={mri ?? 'N/A'} disabled />
                <button onClick={() => copyToClipboard(mri)}><i className="fa fa-clone" ></i></button>
            </div>
            <p>{ threadInfo }</p>
            <hr></hr>
            <label>Request status:</label>
            <pre>
            <p>{ status }</p>
            </pre>
          </div>
          <hr></hr>
          <label>Response status:</label>
          <Highlight language="json" className='json'>
            {JSON.stringify(formValues, null, 2)}
          </Highlight>
          <div id="message-content" className='received'>
          <hr></hr>
          </div>
          <div id="image-attachment"></div>
          <div id="file-attachment"></div>
          <hr/>
        </div>
        <div className='results section' id='http-response-container'>
        <p> HTTP Response Details:</p>
        <Highlight language="json" className='json'>
        <pre id='http-response'></pre>
        </Highlight>
         
        </div>
        <div className='results section' id='blank-container'>
          <div className='loading-container'>
             <i className="fas fa-rocket loading-icon"></i>
            <p className='loading-text'>Fill up details to get started</p>
          </div>
        </div>
      </div>
      <p id='footer'>SDK: 1.5.0, Sgianling: Beta 26, API: 2024-03-07</p>
    </>
  )
}
