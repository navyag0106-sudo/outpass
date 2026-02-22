// Browser Console Firebase Setup Script
// Copy and paste this into your browser console when on your app

(async function setupFirebaseCollections() {
  try {
    console.log('🚀 Starting Firebase collections setup...');
    
    // Import Firebase functions (they should already be available in your app)
    const { db } = await import('../firebase.js');
    const { collection, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js');
    
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
          phone: "+91-9876543212",
          address: "123 College Road, City",
          wardenId: "warden-sample-uid-1",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        }
      ]
    };
    
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
    
    // Create sample outpass requests
    console.log('📝 Creating outpassRequests collection...');
    const sampleOutpassRequests = [
      {
        userId: "student-sample-uid-1",
        studentName: "Alice Williams",
        registrationNo: "CS2024001",
        destination: "Home Town",
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        arrivalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        reason: "Family function",
        status: "pending",
        dateApplied: serverTimestamp(),
        createdAt: serverTimestamp()
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
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('   Admin: admin@hostel.com');
    console.log('   Warden: warden@hostel.com');
    console.log('   Student: student1@college.edu');
    console.log('\n⚠️  Note: You\'ll need to create Firebase Authentication users with these emails');
    
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
  }
})();
