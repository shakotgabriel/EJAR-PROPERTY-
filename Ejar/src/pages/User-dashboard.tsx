import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { Bell, MessageCircle, User, Home, Plus } from "lucide-react";
import { toCardProperty } from "@/store/propertyStore";

const UserDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { myProperties, isLoading, fetchMyProperties } = useProperties();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      fetchMyProperties();
    }
  }, [authLoading, user, fetchMyProperties]);

  const listingsCount = myProperties.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Dashboard</p>
              <h1 className="text-3xl font-bold">
                Welcome, {user?.first_name || user?.email || "Guest"}
              </h1>
              <p className="text-white/80 text-sm">
                Manage your listings, messages, and profile settings.
              </p>
            </div>
            <Button
              className="flex items-center gap-2 bg-white/90 text-blue-700 hover:bg-white"
              onClick={() => navigate("/add-property")}
            >
              <Plus className="h-4 w-4" />
              Add New Listing
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">Total Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700">
                {isLoading ? "..." : listingsCount}
              </p>
              <p className="text-xs text-slate-400">All properties you&apos;ve posted</p>
            </CardContent>
          </Card>

          <Card className="border border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700">
                {isLoading ? "..." : listingsCount}
              </p>
              <p className="text-xs text-slate-400">Currently visible to renters</p>
            </CardContent>
          </Card>

          <Card className="border border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-500">Unread Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700">0</p>
              <p className="text-xs text-slate-400">New updates and alerts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant="outline"
            className="justify-start gap-2 border-blue-100 text-blue-700"
            onClick={() => navigate("/user-listings")}
          >
            <Home className="h-4 w-4" />
            My Listings
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 border-blue-100 text-blue-700"
            onClick={() => navigate("/messages")}
          >
            <MessageCircle className="h-4 w-4" />
            Messages
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 border-blue-100 text-blue-700"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 border-blue-100 text-blue-700"
            onClick={() => navigate("/profile")}
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Listings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading listings...</p>
              ) : listingsCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center">
                  <h2 className="text-lg font-semibold text-blue-900 mb-2">
                    You haven&apos;t listed any properties yet
                  </h2>
                  <p className="text-gray-600 mb-4">Create your first listing to get started.</p>
                  <Button onClick={() => navigate("/add-property")}>+ New Listing</Button>
                </div>
              ) : (
                myProperties.slice(0, 3).map((listing) => {
                  const card = toCardProperty(listing);
                  return (
                    <div
                      key={listing.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-slate-200 p-4 hover:shadow-md transition"
                    >
                      <img
                        src={card.image || "/images/placeholder-property.jpg"}
                        alt={listing.title}
                        className="h-20 w-full sm:w-28 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {listing.title}
                        </p>
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {card.location}
                        </p>
                        <p className="text-sm font-semibold text-blue-700 mt-1">
                          ${card.price.toLocaleString()} / month
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="self-stretch sm:self-auto"
                        onClick={() => navigate(`/edit-property/${listing.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => navigate("/add-property")}>
                Add Property
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/messages")}>
                Open Messages
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/notifications")}>
                View Notifications
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
