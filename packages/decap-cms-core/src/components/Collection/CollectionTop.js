import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components, buttons, shadows } from 'decap-cms-ui-default';

const CollectionTopContainer = styled.div`
  ${components.cardTop};
  width: 100%;
  max-width: none;
  box-sizing: border-box;
`;

const CollectionTopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const CollectionTopHeading = styled.h1`
  ${components.cardTopHeading};
`;

const CollectionTopNewButton = styled(Link)`
  ${buttons.button};
  ${shadows.dropDeep};
  ${buttons.default};
  ${buttons.gray};
  white-space: nowrap;

  padding: 0 30px;
`;

const CollectionTopDescription = styled.p`
  ${components.cardTopDescription};
`;

function getCollectionProps(collection) {
  const collectionLabel = collection.get('label');
  const collectionLabelSingular = collection.get('label_singular');
  const collectionDescription = collection.get('description');

  return {
    collectionLabel,
    collectionLabelSingular,
    collectionDescription,
  };
}

function CollectionTop({ collection, newEntryUrl, t, children }) {
  const { collectionLabel, collectionLabelSingular, collectionDescription } = getCollectionProps(
    collection,
    t,
  );

  return (
    <CollectionTopContainer>
      <CollectionTopRow>
        <CollectionTopHeading>{collectionLabel}</CollectionTopHeading>
        <div css={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginLeft: 'auto' }}>
        {children}
        {newEntryUrl ? (
          <CollectionTopNewButton
            to={newEntryUrl}
            dir="auto"
            aria-label={t('collection.collectionTop.newButtonAriaLabel', {
              collectionLabel: collectionLabelSingular || collectionLabel,
            })}
          >
            {t('collection.collectionTop.newButton', {
              collectionLabel: collectionLabelSingular || collectionLabel,
            })}
          </CollectionTopNewButton>
        ) : null}
        </div>
      </CollectionTopRow>
      {collectionDescription ? (
        <CollectionTopDescription>{collectionDescription}</CollectionTopDescription>
      ) : null}
    </CollectionTopContainer>
  );
}

CollectionTop.propTypes = {
  collection: ImmutablePropTypes.map.isRequired,
  newEntryUrl: PropTypes.string,
  t: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default translate()(CollectionTop);
