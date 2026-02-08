from __future__ import annotations
import random
from dataclasses import dataclass
from typing import Iterable
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
@dataclass(frozen=True)
class SeedUser:
    email: str
    first_name: str
    last_name: str
    role: str
    phone_number: str | None = None
    is_verified: bool = True
class Command(BaseCommand):
    help = "Seed demo users: landlords, agents, and 2 admins (South Sudan-style names/numbers)."
    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            type=str,
            default="Password123!",
            help="Password to set for newly created users (default: Password123!).",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=211,
            help="Random seed for deterministic output (default: 211).",
        )
        parser.add_argument(
            "--landlords",
            type=int,
            default=8,
            help="How many landlord users to create (default: 8).",
        )
        parser.add_argument(
            "--agents",
            type=int,
            default=4,
            help="How many agent users to create (default: 4).",
        )
        parser.add_argument(
            "--tenants",
            type=int,
            default=0,
            help="Optional: how many tenant users to create (default: 0).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing non-admin users before seeding (keeps admins).",
        )
    @transaction.atomic
    def handle(self, *args, **options):
        password: str = options["password"]
        seed_value: int = options["seed"]
        landlord_count: int = options["landlords"]
        agent_count: int = options["agents"]
        tenant_count: int = options["tenants"]
        clear: bool = options["clear"]
        random.seed(seed_value)
        User = get_user_model()
        if clear:
            deleted, _ = User.objects.exclude(role="admin").delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing non-admin users."))
        base_users = list(_base_seed_users())
        dynamic_users = list(_generate_more_users(landlord_count, agent_count, tenant_count))
        to_create = _dedupe_by_email(base_users + dynamic_users)
        created = 0
        updated = 0
        admins_created = 0
        for u in to_create:
            existing = User.objects.filter(email=u.email).first()
            if existing is None:
                if u.role == "admin":
                    user = User.objects.create_superuser(
                        email=u.email,
                        password=password,
                        role="admin",
                        first_name=u.first_name,
                        last_name=u.last_name,
                        phone_number=u.phone_number,
                        is_verified=u.is_verified,
                    )
                    admins_created += 1
                else:
                    user = User.objects.create_user(
                        email=u.email,
                        password=password,
                        role=u.role,
                        first_name=u.first_name,
                        last_name=u.last_name,
                        phone_number=u.phone_number,
                        is_verified=u.is_verified,
                    )
                created += 1
                _ = user.profile
                continue
            changed_fields: list[str] = []
            if not existing.first_name and u.first_name:
                existing.first_name = u.first_name
                changed_fields.append("first_name")
            if not existing.last_name and u.last_name:
                existing.last_name = u.last_name
                changed_fields.append("last_name")
            if not existing.phone_number and u.phone_number:
                existing.phone_number = u.phone_number
                changed_fields.append("phone_number")
            if u.role == "admin":
                if existing.role != "admin":
                    existing.role = "admin"
                    changed_fields.append("role")
                if not existing.is_staff:
                    existing.is_staff = True
                    changed_fields.append("is_staff")
                if not existing.is_superuser:
                    existing.is_superuser = True
                    changed_fields.append("is_superuser")
            if changed_fields:
                existing.save(update_fields=changed_fields)
                updated += 1
        summary = (
            f"Seed users complete. Created={created}, Updated={updated}, "
            f"Admins(total target=2, created now={admins_created})."
        )
        self.stdout.write(self.style.SUCCESS(summary))
        self.stdout.write("Default password for newly created users: " + password)
def _base_seed_users() -> Iterable[SeedUser]:
    return [
        SeedUser(
            email="admin1@ejar.local",
            first_name="Admin",
            last_name="One",
            role="admin",
            phone_number="+211 910 000 001",
        ),
        SeedUser(
            email="admin2@ejar.local",
            first_name="Admin",
            last_name="Two",
            role="admin",
            phone_number="+211 910 000 002",
        ),
        SeedUser(
            email="john.deng@juba.example",
            first_name="John",
            last_name="Deng",
            role="landlord",
            phone_number="+211 912 345 678",
        ),
        SeedUser(
            email="mary.kuol@juba.example",
            first_name="Mary",
            last_name="Kuol",
            role="landlord",
            phone_number="+211 922 110 445",
        ),
        SeedUser(
            email="peter.gatluak@juba.example",
            first_name="Peter",
            last_name="Gatluak",
            role="agent",
            phone_number="+211 915 778 202",
        ),
        SeedUser(
            email="sarah.nyandeng@juba.example",
            first_name="Sarah",
            last_name="Nyandeng",
            role="landlord",
            phone_number="+211 914 003 901",
        ),
    ]
def _generate_more_users(landlords: int, agents: int, tenants: int) -> Iterable[SeedUser]:
    first_names = [
        "Deng",
        "Kuol",
        "Nyandeng",
        "Gatluak",
        "Ajak",
        "Bol",
        "James",
        "Martha",
        "Peter",
        "Mary",
        "Daniel",
        "Rebecca",
        "Paul",
        "Agnes",
    ]
    last_names = [
        "Deng",
        "Kuol",
        "Gatluak",
        "Nyachol",
        "Lual",
        "Machar",
        "Atem",
        "Wani",
        "Lado",
        "Yak",
        "Majok",
        "Gai",
    ]
    def phone() -> str:
        prefix = random.choice(["912", "914", "915", "916", "917", "922", "923"])
        rest = random.randint(100_000, 999_999)
        return f"+211 {prefix} {rest // 1000:03d} {rest % 1000:03d}"
    def email_for(role: str, n: int) -> str:
        return f"{role}{n}@ejar.local"
    users: list[SeedUser] = []
    for i in range(1, landlords + 1):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        users.append(
            SeedUser(
                email=email_for("landlord", i),
                first_name=fn,
                last_name=ln,
                role="landlord",
                phone_number=phone(),
            )
        )
    for i in range(1, agents + 1):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        users.append(
            SeedUser(
                email=email_for("agent", i),
                first_name=fn,
                last_name=ln,
                role="agent",
                phone_number=phone(),
            )
        )
    for i in range(1, tenants + 1):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        users.append(
            SeedUser(
                email=email_for("tenant", i),
                first_name=fn,
                last_name=ln,
                role="tenant",
                phone_number=phone(),
            )
        )
    return users
def _dedupe_by_email(users: list[SeedUser]) -> list[SeedUser]:
    seen: set[str] = set()
    out: list[SeedUser] = []
    for u in users:
        key = u.email.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(u)
    return out

