import React from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Temporary demo data
const sampleProperties = [
  {
    id: 1,
    title: "Modern Apartment in Tongping",
    price: 250000,
    location: "Juba, Tongping",
    image:
      "https://images.unsplash.com/photo-1560185008-5bf9f2849480?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 2,
    title: "3 Bedroom Villa in Gudele",
    price: 350000,
    location: "Juba, Gudele",
    image:
      "https://images.unsplash.com/photo-1599423300746-b62533397364?auto=format&fit=crop&w=800&q=60",
  },
];

const MyProperties: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">My Properties</h1>

      {sampleProperties.length === 0 ? (
        <Card className="p-6 text-center border-dashed border-2 border-gray-300">
          <CardTitle>You haven’t added any properties yet</CardTitle>
          <p className="text-gray-500 mt-2">Add your first property listing</p>
          <Button className="mt-4 bg-blue-600 text-white">+ New Listing</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              {/* Image */}
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-40 object-cover"
              />

        
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold">{property.title}</h2>
                <p className="text-gray-600 text-sm">{property.location}</p>
                <p className="font-bold mt-2">{property.price.toLocaleString()} SSP</p>

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => console.log("View property", property.id)}
                  >
                    View
                  </Button>

                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => console.log("Edit property", property.id)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    className="text-sm"
                    onClick={() => console.log("Delete property", property.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProperties;
