from __future__ import absolute_import

import responses
import time

from sentry.integrations.msteams.utils import get_channel_id
from sentry.models import Integration
from sentry.testutils import TestCase
from sentry.utils import json


EXAMPLE_MEMBER_ADDED = {
    "recipient": {"id": "28:5710acff-f313-453f-8b75-44fff54bab14", "name": "Steve-Bot-5"},
    "from": {
        "aadObjectId": "a6de2a64-9501-4e16-9e50-74df223570a3",
        "id": "29:1Q2o9Y0pyxOhK7QU6o7DatYWMy4MFapyiHoA1r_xB2s5XsGTSxIrKOH_JGmxDXpex30trbSo3Oyh3pkXF8RnlVQ",
    },
    "conversation": {
        "id": "19:8d46058cda57449380517cc374727f2a@thread.tacv2",
        "conversationType": "channel",
        "isGroup": True,
        "tenantId": "f5ffd8cf-a1aa-4242-adad-86509faa3be5",
    },
    "timestamp": "2020-07-13T19:54:30.8044041Z",
    "channelId": "msteams",
    "membersAdded": [{"id": "28:5710acff-f313-453f-8b75-44fff54bab14"}],
    "serviceUrl": "https://smba.trafficmanager.net/amer/",
    "channelData": {
        "eventType": "teamMemberAdded",
        "tenant": {"id": "f5ffd8cf-a1aa-4242-adad-86509faa3be5"},
        "team": {
            "name": "testsentry",
            "aadGroupId": "c2d5a19b-f3a9-48ed-ade3-fc41aa861a18",
            "id": "19:8d46058cda57449380517cc374727f2a@thread.tacv2",
        },
    },
    "type": "conversationUpdate",
    "id": "f:8e005ef8-f848-156f-55b1-0a5bb3207225",
}


class GetChannelIdTest(TestCase):
    def setUp(self):
        self.resp = responses.mock
        self.resp.__enter__()

        self.integration = Integration.objects.create(
            provider="msteams",
            name="Brute Squad",
            external_id="3x73rna1-id",
            metadata={
                "service_url": "https://smba.trafficmanager.net/amer",
                "access_token": "inc0nc3iv4b13",
                "expires_at": int(time.time()) + 86400,
            },
        )
        self.integration.add_organization(self.event.project.organization, self.user)
        channels = [
            {"id": "g_c"},
            {"id": "p_o_d", "name": "Pit of Despair"},
        ]
        first_users = [
            {"name": "Wesley", "id": "d_p_r", "tenantId": "3141-5926-5358"},
            {"name": "Buttercup", "id": "p_b", "tenantId": "2718-2818-2845"},
        ]
        second_users = [{"name": "Inigo", "id": "p_t_d", "tenantId": "1618-0339-8874"}]
        self.resp.add(
            method=responses.GET,
            url="https://smba.trafficmanager.net/amer/v3/teams/3x73rna1-id/conversations",
            status=200,
            content_type="application/json",
            body=json.dumps({"conversations": channels}),
        )
        self.resp.add(
            method=responses.GET,
            url="https://smba.trafficmanager.net/amer/v3/conversations/3x73rna1-id/pagedmembers?pageSize=500",
            status=200,
            content_type="application/json",
            body=json.dumps({"members": first_users, "continuationToken": "con71nu3"}),
        )
        self.resp.add(
            method=responses.GET,
            url="https://smba.trafficmanager.net/amer/v3/conversations/3x73rna1-id/pagedmembers?pageSize=500&continuationToken=con71nu3",
            status=200,
            content_type="application/json",
            body=json.dumps({"members": second_users}),
        )

        def user_conversation_id_callback(request):
            payload = json.loads(request.body)
            if payload["members"] == [{"id": "d_p_r"}] and payload["channelData"] == {
                "tenant": {"id": "3141-5926-5358"}
            }:
                return (200, {}, json.dumps({"id": "dread_pirate_roberts"}))
            elif payload["members"] == [{"id": "p_b"}] and payload["channelData"] == {
                "tenant": {"id": "2718-2818-2845"}
            }:
                return (200, {}, json.dumps({"id": "princess_bride"}))
            elif payload["members"] == [{"id": "p_t_d"}] and payload["channelData"] == {
                "tenant": {"id": "1618-0339-8874"}
            }:
                return (200, {}, json.dumps({"id": "prepare_to_die"}))

        self.resp.add_callback(
            method=responses.POST,
            url="https://smba.trafficmanager.net/amer/v3/conversations",
            callback=user_conversation_id_callback,
            content_type="application/json",
        )

    def tearDown(self):
        self.resp.__exit__(None, None, None)

    def run_valid_test(self, expected, name):
        assert expected == get_channel_id(self.organization, self.integration.id, name)

    def run_invalid_test(self, name):
        assert get_channel_id(self.organization, self.integration.id, name) is None

    def test_general_channel_selected(self):
        self.run_valid_test("g_c", "General")

    def test_other_channel_selected(self):
        self.run_valid_test("p_o_d", "Pit of Despair")

    def test_bad_channel_not_selected(self):
        self.run_invalid_test("Cliffs of Insanity")

    def test_user_selected(self):
        self.run_valid_test("dread_pirate_roberts", "Wesley")

    def test_other_user_selected(self):
        self.run_valid_test("princess_bride", "Buttercup")

    def test_other_user_selected_continuation(self):
        self.run_valid_test("prepare_to_die", "Inigo")

    def test_bad_user_not_selected(self):
        self.run_invalid_test("Prince Humperdinck")
