## ❓The problem at hand.
How might we leverage an AI tool tracker to ensure **surgical safety** for **every patient**?

## 🌱 Where did this stem from?
A surgical tool **"the size of a dinner plate"** has been discovered inside a woman's abdomen 18 months after undergoing a c-section while giving birth to her child – ABC news. 

There are 3,000 surgeries like this PER YEAR where surgical tools get left inside a patient's body. You may ask, aren’t nurses there to ensure this doesn’t happen? Unfortunately, traditional methods of manual tracking are unreliable. Even with **12 medical staff** present in the surgery, a surgical tool as large as the size of a dinner plate was left in the woman’s body. This ongoing risk to patient safety is unacceptable, especially when lives are on the line.

## 📑 What does Surgical.AI do?
Our AI Tool Tracker is named Surgi. Surgi helps medical staff…
1. **Track** surgical tools before and during surgeries 
2. Find the last 5 seconds of a tool in search 
3. **Hands-free** communication during surgery 

## 🩻 How does it work?
We constantly track and segment/highlight medical tools during surgery via a real-time video stream and update the state of the objects (in place, out of place, or missing). We periodically save snapshots of the state to our database. Medical staff can query for a tool using their voice to view a video snippet of when it was last seen.

## 👩‍⚕️ How we built it
**UI/UX Design** We used Figma and FigJam to lay out the user flow, using research from notable media stations like ABC News and NBC News to support our visual designs and design system with data.

**Frontend** Next.js, ShadCN, Tailwind CSS, Deepgram

**Backend** Gemini, Yolov11, Firebase, Websockets

##  🩺 Challenges we ran into
A challenge we faced was figuring out what technologies we could use to accurately and efficiently identify tools that matched before and during surgery. We had to find technologies that could match tools in real-time despite the noise around them. We also had to read up on many new resources we used for this product. 

With all these backend technical advancements, we had to communicate these changes quickly to the front end to carry out our visions seamlessly. The front end had to adjust accordingly to the viable features we were able to display. 

## 📈 Accomplishments that we're proud of
We’re proud to have developed a powerful and well-rounded product in just 36 hours! By leveraging the expertise of our front-end and back-end teams, we created a fully functional tool designed to tackle an urgent and critical issue: ensuring surgical tools are tracked to prevent errors and enhance patient safety.

## 🍵 What we learned
We learned that many patients and surgeons are anxious about the risks associated with surgical errors, especially given that thousands occur each year. Surprisingly, no comprehensive tools are currently available that accurately track surgical instruments in real time, which is quite concerning. We also discovered that we could create the tool we wished existed to ensure patient safety. Learning how to leverage Meta SAM2 for tool detection and integrating it with a voice agent AI was an exciting new skill we developed in the process.

## ⏭ What's next for Surgical.AI?
We strive to implement Surgical.AI into healthcare educational systems to help train surgeons and medical staff with our tool-detecting system. We also plan on using our advanced software in other fields that require accurate detection as well. For example, spotting shoplifters at stores.
