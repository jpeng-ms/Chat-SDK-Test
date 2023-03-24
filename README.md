# Chat SDK Test

An sample project that helps developers to test out Chat JS SDK.

# Getting started

run `npm install; npm start` to start the demo. 

The webpage would be hosted under `http://localhost:3000/`

# Supported Chats 
1. ACS Chat with ACS user
2. Interop chat with Teams user
       - enter meeting URL as thread ID, then choose `join call/chat`
       - make sure you are admitted to the call before starting any chat related activities
       

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
