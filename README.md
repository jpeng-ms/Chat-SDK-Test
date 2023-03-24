# Chat SDK Debug Tool
An sample project that helps developers to test out Chat JS SDK (@azure/communication-chat).

# Background
Azure Communication Service (ACS) provides various communication services such as Calling, Chat, SMS, etc. This tool is meanly used by ACS developers to test the Chat functionality between ACS user and Teams user (Interop and Adhoc). Learn more about ACS [here](https://learn.microsoft.com/en-us/azure/communication-services/overview).

Specially, you need to obtain the following information:

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
<img width="1620" alt="image" src="https://user-images.githubusercontent.com/109105353/227407588-47fe4ea5-2106-4883-b061-9a542e44f711.png">

3. Adhoc chat with Teams user
       - select `new thread` tab
       - select `create chat`
       - select `add participant`
          - enter the MRI, display of the Teams user
          - *make sure the Teams tenant has ACS Interop federation enabled*

<img width="1541" alt="image" src="https://user-images.githubusercontent.com/109105353/227406497-fbf80e75-cdb4-4a92-8145-4469785b37e5.png">

# Others



### credit
project build on top of `react-advanced-form`: https://github.com/taniarascia/react-advanced-form
