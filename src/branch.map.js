var branch_map = {
  debugMessages: {
    'nonInit':      'Branch SDK not initialized',
    'existingInit': 'Branch SDK already initilized',
    'missingParam': 'Missing required parameter ',
    'invalidParam': 'Invalid parameter ',
    'missingAppId': 'Missing Branch app ID'
  },
  formap: {
    string:     /.*/,
    email:      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    password:   /.{6,}/,
    uuid:       /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    appId:      /^[0-9]{17}$/,
    identityId: /^[0-9]{17}$/,
    sessionId:  /^[0-9]{17}$/,
    jsonObj:    'object',
    number:     /^d+$/
  },
  resources: {
    session: {
      sessionOpen: {
        endpoint: '/v1/open',
        method:   'POST',
        params: {
          app_id: {
            type: 'appId',
            required: true
          },
          identity_id: {
            type: 'identityId',
            required: false
          },
          link_identifier: {
            type: 'string',
            required: false
          },
          is_referrable: {
            type: 'number',
            required: true
          },
          browser_fingerprint_id: {
            type: 'string',
            required: false
          }
        }
      },
      sessionProfile: {
        endpoint: '/v1/profile',
        method:   'POST',
        ref: 'obj',
        params: {
          app_id: {
            type: 'appId',
            required: true
          },
          identity_id: {
            type: 'identityId',
            required: false
          },
          obj: {
            type: 'jsonObj', 
            required: true,
            ref: 'obj',
            params: {
              identity: {
                type: 'string',
                required: true
              },
              set: {
                type: 'jsonObj',
                required: false
              },
              add: {
                type: 'jsonObj',
                required: false
              },
              append: {
                type: 'jsonObj',
                required: false
              },
              union: {
                type: 'jsonObj',
                required: false
              }
            }
          }
        }
      },
      sessionClose: {
        endpoint: '/v1/close',
        method: 'POST',
        params: {
          app_id: {
            type: 'appId',
            required: true
          },
          session_id: {
            type: 'sessionId',
            required: true
          }
        }
      },
      sessionLogout: {
        endpoint: '/v1/logout',
        method: 'POST',
        params: {
          app_id: {
            type: 'appId',
            required: true
          },
          session_id: {
            type: 'sessionId',
            required: true
          }
        }
      }
    },
    referrals: {
      showReferrals: {
        endpoint: '/v1/referrals/:identity_id',
        method: 'GET',
        rest: [
          'identity_id'
        ],
        params: {
          app_id: {
            type: 'appId',
            required: true
          },
          identity_id: {
            type: 'identityId',
            required: true
          }
        }
      },
      showCredits: {
        endpoint: '/v1/credits/:identity_id',
        method: 'GET',
        rest: [
          'identity_id'
        ],
        params: {
          app_id: {
            type: 'appId',
            required: true,
          },
          identity_id: {
            type: 'identityId',
            required: true
          }
        }
      },
      redeemCredits: {
        endpoint: '/v1/redeem',
        method: 'POST',
        ref: 'obj',
        params: {
          app_id: {
            type: 'appId',
            required: true,
          },
          identity_id: {
            type: 'identityId',
            required: true
          },
          obj: {
            type: 'jsonObj',
            required: true,
            ref: 'obj',
            params: {
              amount: {
                type: 'number',
                required: true
              },
              bucket: {
                type: 'string',
                required: false
              }
            }
          }
        }
      }
    },
    links:  {
      createLink: {
        endpoint: '/v1/url',
        method: 'POST',
        ref: 'obj',
        params: {
          app_id: {
            type: 'appId',
            required: true
          },
          identity: {
            type: 'identityId',
            required: true
          },
          obj: {
            type: 'jsonObj',
            required: true,
            ref: 'obj',
            params: {
              data:{
                type: 'jsonObj',
                required: false
              },
              tags: {
                type: 'jsonArray',
                required: false
              },
              feature: {
                type: 'string',
                required: false
              },
              channel: {
                type: 'string',
                required: false
              },
              stage: {
                type: 'string',
                required: false
              },
              type: {
                type: 'number',
                required: false
              }
            }
          }
        }
      },
      createLinkClick: {
        api: false,
        endpoint: ':link_url',
        method: 'GET',
        rest: [
          'link_url'
        ],
        params: {
          link_url: {
            type: 'string',
            required: true,
          }
        }
      },
      sendSMSLink: {
        api: false,
        endpoint: ':link_url',
        method: 'POST',
        rest: [
          'link_url'
        ],
        params: {
          phone: {
            type: 'string',
            required: true
          },
          link_url: {
            type: 'string',
            required: true,
          }
        }
      }
    },
    events: {
      track: {
        endpoint: '/v1/event',
        method: 'POST',
        params: {
          app_id: {
            type: 'appId',
            required: true,
          },
          session_id: {
            type: 'sessionId',
            required: true
          },
          event: {
            type: 'string',
            required: true
          },
          metadata: {
            type: 'jsonObj',
            required: false
          }
        }
      }
    }
  }
};
