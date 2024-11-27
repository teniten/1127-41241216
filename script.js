import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  get, 
  remove 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIVW_wM5vGdNp2VlfqJXBjxDixdRqF5S4",
  authDomain: "project-3114685523754369152.firebaseapp.com",
  databaseURL: "https://project-3114685523754369152-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "project-3114685523754369152",
  storageBucket: "project-3114685523754369152.appspot.com",
  messagingSenderId: "660853900271",
  appId: "1:660853900271:web:d25b218d662fe80e516c1a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfoBtn = document.getElementById('userInfoBtn');
const authButtons = document.getElementById('authButtons');
const userButtons = document.getElementById('userButtons');
const noteSection = document.getElementById('noteSection');
const notesList = document.getElementById('notesList');
const addNoteForm = document.getElementById('addNoteForm');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');

// 修改筆記 Modal
const editNoteTitle = document.getElementById('editNoteTitle');
const editNoteContent = document.getElementById('editNoteContent');
const saveEditNoteBtn = document.getElementById('saveEditNoteBtn');
let editNoteKey = null;

// 會員資訊 Modal
const userInfoModal = new bootstrap.Modal(document.getElementById('userInfoModal'));
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userLastLogin = document.getElementById('userLastLogin');

// 註冊按鈕
registerBtn.addEventListener('click', () => googleSignIn(true));

// 登入按鈕
loginBtn.addEventListener('click', () => googleSignIn(false));

// 登出按鈕
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    authButtons.classList.remove('d-none');
    userButtons.classList.add('d-none');
    noteSection.classList.add('d-none');
    Swal.fire('登出成功', '歡迎下次再來！', 'success');
  });
});

// 顯示會員資訊
userInfoBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (user) {
    userAvatar.src = user.photoURL || 'https://via.placeholder.com/100';
    userName.textContent = user.displayName;
    userEmail.textContent = user.email;
    userLastLogin.textContent = `最後登入時間：${new Date(user.metadata.lastSignInTime).toLocaleString('zh-TW')}`;
    userInfoModal.show();
  }
});

// 新增筆記
addNoteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (user) {
    const notesRef = ref(database, 'notes/' + user.uid);
    const newNoteRef = push(notesRef);
    set(newNoteRef, {
      title: noteTitle.value,
      content: noteContent.value
    }).then(() => {
      noteTitle.value = '';
      noteContent.value = '';
      Swal.fire('新增成功', '筆記已儲存', 'success');
    });
  }
});

// Google 登入/註冊功能
function googleSignIn(isRegister) {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      const userRef = ref(database, 'members/' + user.uid);

      if (isRegister) {
        // 註冊新會員
        set(userRef, {
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          lastLogin: new Date().toISOString()
        });
        Swal.fire('註冊成功', '請重新登入', 'success');
      } else {
        // 登入檢查是否已註冊
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            // 已註冊，繼續登入
            loadNotes(user);
            authButtons.classList.add('d-none');
            userButtons.classList.remove('d-none');
            noteSection.classList.remove('d-none');
            const lastLoginRef = ref(database, 'members/' + user.uid + '/lastLogin');
            set(lastLoginRef, new Date().toISOString());
          } else {
            // 未註冊
            Swal.fire('登入失敗', '請先註冊再登入', 'error');
            signOut(auth); // 登出未註冊用戶
          }
        });
      }
    })
    .catch((error) => Swal.fire('錯誤', error.message, 'error'));
}

// 加載筆記
function loadNotes(user) {
  const notesRef = ref(database, 'notes/' + user.uid);
  onValue(notesRef, (snapshot) => {
    const notes = snapshot.val();
    notesList.innerHTML = '';
    if (notes) {
      Object.keys(notes).forEach((key) => {
        const note = notes[key];
        const noteItem = `
          <div class="note-item mb-3">
            <div class="d-flex justify-content-between">
              <div><strong>${note.title}</strong></div>
              <div>
                <button class="btn btn-warning btn-sm" onclick="editNote('${key}', '${note.title}', '${note.content}')">修改</button>
                <button class="btn btn-danger btn-sm ms-2" onclick="deleteNote('${user.uid}', '${key}')">刪除</button>
              </div>
            </div>
            <p>${note.content}</p>
          </div>`;
        notesList.innerHTML += noteItem;
      });
    }
  });
}

// 修改筆記
window.editNote = function (noteKey, title, content) {
  editNoteKey = noteKey;
  editNoteTitle.value = title;
  editNoteContent.value = content;
  const editNoteModal = new bootstrap.Modal(document.getElementById('editNoteModal'));
  editNoteModal.show();
};

saveEditNoteBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (user && editNoteKey) {
    const noteRef = ref(database, `notes/${user.uid}/${editNoteKey}`);
    set(noteRef, {
      title: editNoteTitle.value,
      content: editNoteContent.value
    }).then(() => {
      Swal.fire('修改成功', '筆記已更新', 'success');
    });
  }
});

// 刪除筆記
window.deleteNote = function (userId, noteKey) {
  const noteRef = ref(database, `notes/${userId}/${noteKey}`);
  remove(noteRef).then(() => Swal.fire('刪除成功', '筆記已刪除', 'success'));
};
