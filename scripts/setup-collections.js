// Firebase Collections Setup Script
// This script creates the initial collections and sample data for admin, warden, and student collections

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "outpass-d84b7.firebaseapp.com",
  projectId: "outpass-d84b7",
  storageBucket: "outpass-d84b7.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data for initial setup
const sampleData = {
  admin: [
    {
      uid: "admin-sample-uid-1",
      email: "admin@hostel.com",
      username: "admin",
      name: "System Administrator",
      role: "admin",
      status: "active",
      permissions: {
        canManageUsers: true,
        canManageWardens: true,
        canViewAllOutpasses: true,
        canApproveOutpasses: true,
        canDeleteOutpasses: true,
        canAccessAdminPanel: true
      },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }
  ],
  warden: [
    {
      uid: "warden-sample-uid-1",
      email: "warden@hostel.com",
      username: "warden1",
      name: "John Smith",
      role: "warden",
      status: "active",
      hostel: "Boys Hostel A",
      employeeId: "EMP001",
      phone: "+91-9876543210",
      permissions: {
        canManageUsers: false,
        canManageWardens: false,
        canViewAllOutpasses: true,
        canApproveOutpasses: true,
        canDeleteOutpasses: false,
        canAccessAdminPanel: false
      },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    },
    {
      uid: "warden-sample-uid-2",
      email: "warden2@hostel.com",
      username: "warden2",
      name: "Sarah Johnson",
      role: "warden",
      status: "active",
      hostel: "Girls Hostel B",
      employeeId: "EMP002",
      phone: "+91-9876543211",
      permissions: {
        canManageUsers: false,
        canManageWardens: false,
        canViewAllOutpasses: true,
        canApproveOutpasses: true,
        canDeleteOutpasses: false,
        canAccessAdminPanel: false
      },
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }
  ],
  student: [
    {
      uid: "student-sample-uid-1",
      email: "student1@college.edu",
      username: "student1",
      name: "Alice Williams",
      role: "student",
      status: "active",
      registrationNo: "CS2024001",
      department: "Computer Science",
      year: "3rd Year",
      roomNo: "A-101",
      hostel: "Boys Hostel A",
      phone: "+91-9876543212",
      address: "123 College Road, City",
      wardenId: "warden-sample-uid-1",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    },
    {
      uid: "student-sample-uid-2",
      email: "student2@college.edu",
      username: "student2",
      name: "Bob Brown",
      role: "student",
      status: "active",
      registrationNo: "EC2024001",
      department: "Electronics",
      year: "2nd Year",
      roomNo: "B-205",
      hostel: "Boys Hostel A",
      phone: "+91-9876543213",
      address: "456 Campus Street, City",
      wardenId: "warden-sample-uid-1",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    },
    {
      uid: "student-sample-uid-3",
      email: "student3@college.edu",
      username: "student3",
      name: "Emma Davis",
      role: "student",
      status: "active",
      registrationNo: "ME2024001",
      department: "Mechanical",
      year: "1st Year",
      roomNo: "C-301",
      hostel: "Girls Hostel B",
      phone: "+91-9876543214",
      address: "789 University Avenue, City",
      wardenId: "warden-sample-uid-2",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    },
    {
      uid: "student-sample-uid-4",
      email: "student4@college.edu",
      username: "student4",
      name: "Michael Chen",
      role: "student",
      status: "active",
      registrationNo: "CE2024001",
      department: "Civil Engineering",
      year: "4th Year",
      roomNo: "D-102",
      hostel: "Boys Hostel A",
      phone: "+91-9876543215",
      address: "321 Engineering Lane, City",
      wardenId: "warden-sample-uid-1",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    },
    {
      uid: "student-sample-uid-5",
      email: "student5@college.edu",
      username: "student5",
      name: "Lisa Anderson",
      role: "student",
      status: "active",
      registrationNo: "EE2024001",
      department: "Electrical Engineering",
      year: "2nd Year",
      roomNo: "E-201",
      hostel: "Girls Hostel B",
      phone: "+91-9876543216",
      address: "654 Electrical Avenue, City",
      wardenId: "warden-sample-uid-2",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }
  ]
};

// Function to create collections and sample data
async function setupCollections() {
  try {
    console.log('🚀 Starting Firebase collections setup...');
    
    // Create admin collection
    console.log('📝 Creating admin collection...');
    for (const admin of sampleData.admin) {
      await setDoc(doc(db, 'users', admin.uid), admin);
      console.log(`✅ Created admin: ${admin.name} (${admin.email})`);
    }
    
    // Create warden collection
    console.log('📝 Creating warden collection...');
    for (const warden of sampleData.warden) {
      await setDoc(doc(db, 'users', warden.uid), warden);
      console.log(`✅ Created warden: ${warden.name} (${warden.email})`);
    }
    
    // Create student collection
    console.log('📝 Creating student collection...');
    for (const student of sampleData.student) {
      await setDoc(doc(db, 'users', student.uid), student);
      console.log(`✅ Created student: ${student.name} (${student.email})`);
    }
    
    // Create outpassRequests collection with sample data
    console.log('📝 Creating outpassRequests collection...');
    const sampleOutpassRequests = [
      {
        userId: "student-sample-uid-1",
        studentName: "Alice Williams",
        registrationNo: "CS2024001",
        destination: "Home Town",
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        arrivalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        reason: "Family function",
        status: "pending",
        dateApplied: serverTimestamp(),
        createdAt: serverTimestamp()
      },
      {
        userId: "student-sample-uid-2",
        studentName: "Bob Brown",
        registrationNo: "EC2024001",
        destination: "City Center",
        departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        arrivalDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        reason: "Medical appointment",
        status: "approved",
        dateApplied: serverTimestamp(),
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        approvedBy: "warden-sample-uid-1"
      }
    ];
    
    for (const request of sampleOutpassRequests) {
      const docRef = doc(collection(db, 'outpassRequests'));
      await setDoc(docRef, request);
      console.log(`✅ Created outpass request for: ${request.studentName} (${request.status})`);
    }
    
    console.log('🎉 Firebase collections setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Admin users: ${sampleData.admin.length}`);
    console.log(`   - Warden users: ${sampleData.warden.length}`);
    console.log(`   - Student users: ${sampleData.student.length}`);
    console.log(`   - Sample outpass requests: ${sampleOutpassRequests.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@hostel.com');
    console.log('   Warden 1: warden@hostel.com');
    console.log('   Warden 2: warden2@hostel.com');
    console.log('   Student 1: student1@college.edu');
    console.log('   Student 2: student2@college.edu');
    console.log('   Student 3: student3@college.edu');
    console.log('\n⚠️  Note: You\'ll need to set passwords in Firebase Authentication');
    
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
    throw error;
  }
}

// Run the setup
setupCollections().then(() => {
  console.log('\n✨ Setup completed! You can now test the application.');
}).catch((error) => {
  console.error('\n💥 Setup failed:', error);
});

export { setupCollections, sampleData };
