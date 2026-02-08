import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Verify from "@/pages/auth/Verify";
import Verified from "@/pages/auth/Verified";
import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
import UserListings from "@/pages/User-listings";
import UserDashboard from "@/pages/User-dashboard";
import AddProperty from "@/pages/AddProperty";
import EditProperty from "@/pages/EditProperty";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Onboarding from "@/pages/onboarding";
import ProtectedRoute from "./routes/protected-route";



function App() {
  return (
 
      <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1">
              <Routes>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify" element={<Verify />} />
                <Route
                  path="/verified"
                  element={
                    <ProtectedRoute>
                      <Verified />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/properties"
                  element={
                    <ProtectedRoute>
                      <Properties />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/properties/:id"
                  element={
                    <ProtectedRoute>
                      <PropertyDetails />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-listings"
                  element={
                    <ProtectedRoute>
                      <UserListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/user-dashboard"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-property"
                  element={
                    <ProtectedRoute>
                      <AddProperty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-property/:id"
                  element={
                    <ProtectedRoute>
                      <EditProperty />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
            <Footer />
          </div>

      </Router>

  );
}

export default App;