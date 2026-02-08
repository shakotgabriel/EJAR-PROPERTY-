from __future__ import annotations
import random
from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from properties.models import Property
class Command(BaseCommand):
    help = "Seed the database with demo Juba (South Sudan) properties."
    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="Number of properties to create (default: 20).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing properties before seeding.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=211,
            help="Random seed for deterministic output (default: 211).",
        )
    @transaction.atomic
    def handle(self, *args, **options):
        count: int = options["count"]
        clear: bool = options["clear"]
        seed_value: int = options["seed"]
        random.seed(seed_value)
        if clear:
            deleted, _ = Property.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing properties."))
        owners = _get_or_create_seed_owners()
        neighborhoods = [
            "Munuki",
            "Gudele",
            "Jebel",
            "Kator",
            "Tongping",
            "Hai Cinema",
            "Hai Malakia",
            "Hai Amarat",
            "Atlabara",
            "Lologo",
            "Nimra Talata",
            "Custom",
            "Juba Na Bari",
            "Hai Salaam",
            "Hai Thoura",
            "Hai Tarawa",
            "Gumba Sherikat",
            "Juba Town",
            "Nyakuron",
            "Rock City",
        ]
        street_bits = [
            "Plot 12, Block B",
            "Plot 8, Block A",
            "Plot 21, Block C",
            "Plot 5, Block D",
            "Plot 14, Block E",
            "Plot 3, Block F",
        ]
        property_types = ["apartment", "house", "studio", "room", "townhouse", "condo"]
        created = 0
        for idx in range(count):
            neighborhood = random.choice(neighborhoods)
            property_type = random.choice(property_types)
            owner = random.choice(owners)
            bedrooms = _pick_bedrooms(property_type)
            bathrooms = _pick_bathrooms(bedrooms, property_type)
            rent_amount = _pick_rent_ssp(property_type, bedrooms, neighborhood)
            security_deposit = rent_amount
            title = _make_title(idx=idx + 1, property_type=property_type, neighborhood=neighborhood, bedrooms=bedrooms)
            description = _make_description(neighborhood=neighborhood, property_type=property_type, bedrooms=bedrooms)
            available_from = date.today() + timedelta(days=random.randint(0, 30))
            Property.objects.create(
                title=title,
                description=description,
                property_type=property_type,
                status="available",
                owner=owner,
                address=f"{random.choice(street_bits)}, {neighborhood}",
                location=neighborhood,
                city="Juba",
                country="South Sudan",
                bedrooms=bedrooms,
                bathrooms=bathrooms,
                rent_amount=rent_amount,
                security_deposit=security_deposit,
                parking_spaces=random.randint(0, 2),
                pets_allowed=random.choice([True, False, False]),
                furnished=random.choice([True, False]),
                utilities_included=random.choice([True, False, False]),
                lease_duration_months=random.choice([6, 12, 12, 24]),
                available_from=available_from,
                is_featured=(idx % 10 == 0),
            )
            created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} properties in Juba, South Sudan."))
        self.stdout.write(
            "Tip: re-run with --clear for a clean reseed, e.g. `python manage.py seed_properties --clear`."
        )
def _get_or_create_seed_owners():
    User = get_user_model()
    seed_owners = [
        {
            "email": "john.deng@juba.example",
            "first_name": "John",
            "last_name": "Deng",
            "phone_number": "+211 912 345 678",
            "role": "landlord",
        },
        {
            "email": "mary.kuol@juba.example",
            "first_name": "Mary",
            "last_name": "Kuol",
            "phone_number": "+211 922 110 445",
            "role": "landlord",
        },
        {
            "email": "peter.gatluak@juba.example",
            "first_name": "Peter",
            "last_name": "Gatluak",
            "phone_number": "+211 915 778 202",
            "role": "agent",
        },
        {
            "email": "sarah.nyandeng@juba.example",
            "first_name": "Sarah",
            "last_name": "Nyandeng",
            "phone_number": "+211 914 003 901",
            "role": "landlord",
        },
    ]
    owners = []
    for data in seed_owners:
        user = User.objects.filter(email=data["email"]).first()
        if user is None:
            user = User.objects.create_user(
                email=data["email"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                role=data["role"],
                password="Password123!",
                phone_number=data["phone_number"],
                is_verified=True,
            )
        else:
            changed = False
            if not getattr(user, "phone_number", None) and data.get("phone_number"):
                user.phone_number = data["phone_number"]
                changed = True
            if not getattr(user, "role", None) and data.get("role"):
                user.role = data["role"]
                changed = True
            if changed:
                user.save(update_fields=["phone_number", "role"])
        owners.append(user)
    return owners
def _make_title(*, idx: int, property_type: str, neighborhood: str, bedrooms: int) -> str:
    type_label = {
        "apartment": "Apartment",
        "house": "House",
        "studio": "Studio",
        "room": "Room",
        "townhouse": "Townhouse",
        "condo": "Condo",
        "commercial": "Commercial Space",
    }.get(property_type, "Property")
    if property_type in {"studio", "room"}:
        size = type_label
    else:
        size = f"{bedrooms}BR {type_label}"
    return f"{size} in {neighborhood} (Juba) #{idx}"
def _make_description(*, neighborhood: str, property_type: str, bedrooms: int) -> str:
    highlights = [
        "Reliable water storage tank",
        "Backup generator-ready connection",
        "Secure compound and gate",
        "Easy access to main roads",
        "Near markets and local services",
        "Good natural ventilation",
    ]
    random.shuffle(highlights)
    bedroom_line = (
        "A compact and practical space" if property_type in {"studio", "room"} else f"A comfortable {bedrooms}-bedroom home"
    )
    return (
        f"{bedroom_line} located in {neighborhood}, Juba. "
        f"Highlights: {', '.join(highlights[:3])}. "
        "Monthly rent and deposit are listed in SSP."
    )
def _pick_bedrooms(property_type: str) -> int:
    if property_type == "studio":
        return 0
    if property_type == "room":
        return 1
    if property_type == "apartment":
        return random.choice([1, 2, 2, 3])
    if property_type in {"house", "townhouse"}:
        return random.choice([2, 3, 3, 4])
    if property_type == "condo":
        return random.choice([1, 2, 3])
    return random.choice([1, 2, 3])
def _pick_bathrooms(bedrooms: int, property_type: str) -> Decimal:
    if property_type in {"studio", "room"}:
        return Decimal("1.0")
    if bedrooms <= 1:
        return Decimal(random.choice(["1.0", "1.5"]))
    if bedrooms == 2:
        return Decimal(random.choice(["1.0", "1.5", "2.0"]))
    return Decimal(random.choice(["2.0", "2.5", "3.0"]))
def _pick_rent_ssp(property_type: str, bedrooms: int, neighborhood: str) -> Decimal:
    base = {
        "room": 120_000,
        "studio": 160_000,
        "apartment": 220_000,
        "condo": 260_000,
        "townhouse": 320_000,
        "house": 350_000,
        "commercial": 500_000,
    }.get(property_type, 220_000)
    premium = {"Nyakuron", "Hai Amarat", "Hai Malakia", "Tongping", "Jebel"}
    if neighborhood in premium:
        base = int(base * 1.15)
    base += bedrooms * 25_000
    base += random.randint(-15_000, 25_000)
    return Decimal(str(max(base, 80_000))).quantize(Decimal("1.00"))

