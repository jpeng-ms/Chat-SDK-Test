# Chat SDK Test Tool
![workflow](https://github.com/jpeng-ms/Chat-SDK-Test/actions/workflows/node.js.yml/badge.svg)
![GitHub issues](https://img.shields.io/github/issues/jpeng-ms/Chat-SDK-Test)
[![License](https://img.shields.io/github/license/jpeng-ms/Chat-SDK-Test)]()

An sample project that helps developers to test out Chat JS SDK (@azure/communication-chat).

# Background
Azure Communication Service (ACS) provides various communication services such as Calling, Chat, SMS, etc. This tool is meant to support ACS developers and provides a testing tool for Chat Interop and Adhoc scenarios specifically. Learn more about ACS [here](https://learn.microsoft.com/en-us/azure/communication-services/overview).

In particular, you might need some or all of the following information:

1. `connection string` of your Azure communication resoruce. You can obtain this via Azure portal. Click [here](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource?tabs=linux&pivots=platform-azp#access-your-connection-strings-and-service-endpoints) for more info
2. `meeting URL` of the Teams meeting you have set up
3. `MRI` of users you would like to add to the chat. For the MRI of ACS users, you can create one on Azure portal. For teams user, you can obtain this either from Teams admin via powerShell or making calls to MS Graph API. 

# Getting started

run `npm install; npm start` to start the demo. 

The webpage would be hosted under `http://localhost:3000/`

# Supported Chat Types
1. ACS Chat with ACS user
2. Interop chat with Teams user
       - enter meeting URL as thread ID, then choose `join call/chat`
       - make sure you are admitted to the call before starting any chat related activities
<img width="1542" alt="image" src="https://user-images.githubusercontent.com/109105353/227407205-92c00efe-9f5a-48f1-a0cc-39cfbf361155.png">
<img width="1623" alt="image" src="https://user-images.githubusercontent.com/109105353/227412701-3a6467b1-98a7-47f3-8234-9d0398a654d5.png">


3. Adhoc chat with Teams user
       - select `new thread` tab
       - select `create chat`
       - select `add participant`
          - enter the MRI, display of the Teams user
          - *make sure the Teams tenant has ACS Interop federation enabled*

<img width="1623" alt="image" src="https://user-images.githubusercontent.com/109105353/227412800-33659c25-2201-499b-86ad-bdc526b8a675.png">

# Others

### Readings
1. https://www.npmjs.com/package/@azure/communication-chat
2. https://learn.microsoft.com/en-us/azure/communication-services/concepts/chat/concepts
3. https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/chat/get-started?tabs=linux&pivots=programming-language-javascript
4. https://learn.microsoft.com/en-us/azure/communication-services/concepts/chat/sdk-features

### Support
Please report any issue in this [github repo](https://github.com/jpeng-ms/Chat-SDK-Test/issues) with steps to reproduce and screenshots if any.

### Credit
- UI based on [`react-advanced-form`](https://github.com/taniarascia/react-advanced-form)
